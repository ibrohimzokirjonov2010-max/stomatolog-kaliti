-- In-app notification center + Telegram delivery state. All access goes through SECURITY DEFINER RPCs (see db.ts);
-- RLS additionally restricts direct (authenticated) access to the row owner.

create table if not exists public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null default '',
  link text,
  order_id text references public.orders(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  tg_sent_at timestamptz,
  tg_attempts int not null default 0
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);
create index if not exists notifications_unread_idx on public.notifications (user_id) where read_at is null;
create index if not exists notifications_tg_idx on public.notifications (created_at) where tg_sent_at is null;
alter table public.notifications enable row level security;
drop policy if exists notifications_owner_select on public.notifications;
drop policy if exists notifications_owner_update on public.notifications;
create policy notifications_owner_select on public.notifications for select to authenticated using (user_id = auth.uid());
create policy notifications_owner_update on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

alter table public.profiles add column if not exists tg_chat_id bigint;
alter table public.profiles add column if not exists tg_linked_at timestamptz;
create unique index if not exists profiles_tg_chat_unique on public.profiles (tg_chat_id) where tg_chat_id is not null;

create table if not exists public.telegram_link_tokens (
  token text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '15 minutes'
);
create index if not exists telegram_link_tokens_user_idx on public.telegram_link_tokens (user_id);
alter table public.telegram_link_tokens enable row level security;

-- ───────────── helpers / triggers ─────────────
create or replace function private.notify(p_user uuid, p_type text, p_title text, p_body text, p_link text, p_order text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_user is null then return; end if;
  insert into public.notifications (user_id, type, title, body, link, order_id) values (p_user, p_type, p_title, p_body, p_link, p_order);
end $$;

create or replace function private.money(p bigint) returns text language sql immutable set search_path = '' as $$
  select replace(to_char(coalesce(p, 0), 'FM999,999,999,999,999'), ',', ' ') || ' so‘m'
$$;

create or replace function private.orders_notify() returns trigger language plpgsql security definer set search_path = '' as $$
declare v_owner uuid; v_link text := '/buyurtmalarim/' || new.id; v_slink text := '/marketplace/sotuvchi?tab=orders';
  v_body text; v_by_buyer boolean;
begin
  if tg_op <> 'UPDATE' then return new; end if;

  -- order assigned to its store right after creation → seller "new order", buyer "sent"
  if old.shop_id is null and new.shop_id is not null and new.status = 'pending_accept' then
    select owner_id into v_owner from public.stores where id = new.shop_id;
    if v_owner is distinct from new.buyer_id then
      perform private.notify(v_owner, 'order_new', 'Yangi buyurtma', new.name || ' · ' || private.money(new.total) || ' · ' || new.id, v_slink, new.id);
    end if;
    perform private.notify(new.buyer_id, 'order_created', 'Buyurtma qabulga yuborildi', 'Sotuvchi qabulini kutmoqda. · ' || new.id, v_link, new.id);
  end if;

  if new.status is distinct from old.status then
    if new.status = 'qabul_qilindi' then
      perform private.notify(new.buyer_id, 'order_status', 'Buyurtma qabul qilindi', 'Sotuvchi buyurtmangizni qabul qildi. Yig‘ish boshlanadi. · ' || new.id, v_link, new.id);
    elsif new.status = 'yigilmoqda' then
      perform private.notify(new.buyer_id, 'order_status', 'Buyurtma yig‘ilmoqda', 'Buyurtmangiz yig‘ilmoqda. Tez orada jo‘natiladi. · ' || new.id, v_link, new.id);
    elsif new.status = 'yigish_tugadi' then
      perform private.notify(new.buyer_id, 'order_status', 'Yig‘ish tugadi', 'Buyurtma yig‘ib bo‘lindi — jo‘natishga tayyor. · ' || new.id, v_link, new.id);
    elsif new.status = 'yolda' then
      v_body := 'Buyurtmangiz yetkazib berish uchun yo‘lda.'
        || coalesce(' Kuryer: ' || nullif(new.courier_name, ''), '')
        || coalesce(' · ' || nullif(new.courier_phone, ''), '')
        || coalesce(' · ' || nullif(new.car_info, ''), '')
        || coalesce(' Kuzatish: ' || nullif(new.yandex_track_url, ''), '')
        || ' · ' || new.id;
      perform private.notify(new.buyer_id, 'order_status', 'Buyurtma yo‘lda', v_body, v_link, new.id);
    elsif new.status = 'yetkazildi' then
      perform private.notify(new.buyer_id, 'order_status', 'Buyurtma yetkazildi — tasdiqlang',
        'Mahsulotni tekshirib, “Tasdiqlash” ni bosing — shundan keyin pul sotuvchiga o‘tadi. · ' || new.id, v_link, new.id);
    end if;
  elsif new.status = 'yolda'
    and (new.yandex_track_url, new.courier_name, new.courier_phone, new.car_info) is distinct from (old.yandex_track_url, old.courier_name, old.courier_phone, old.car_info) then
    perform private.notify(new.buyer_id, 'order_track', 'Kuzatuv ma’lumotlari yangilandi',
      'Kuryer: ' || coalesce(nullif(new.courier_name, ''), '—') || coalesce(' · ' || nullif(new.courier_phone, ''), '') || coalesce(' · ' || nullif(new.car_info, ''), '')
      || coalesce(' Kuzatish: ' || nullif(new.yandex_track_url, ''), '') || ' · ' || new.id, v_link, new.id);
  end if;

  if new.payment_state is distinct from old.payment_state then
    select owner_id into v_owner from public.stores where id = new.shop_id;
    if new.payment_state = 'released' then
      v_by_buyer := not exists (select 1 from public.disputes d where d.order_id = new.id and d.status = 'resolved' and d.resolved_by is distinct from new.buyer_id);
      perform private.notify(new.buyer_id, 'order_paid', 'To‘lov yakunlandi', 'Pul sotuvchiga o‘tkazildi. · ' || new.id, v_link, new.id);
      perform private.notify(v_owner, 'order_released',
        case when v_by_buyer then 'Xaridor tasdiqladi — to‘lov yakunlandi' else 'Nizo hal qilindi — to‘lov yakunlandi' end,
        'Pul komissiya ushlab qolinib hisobingizga o‘tkazildi. · ' || new.id, v_slink, new.id);
    elsif new.payment_state = 'refunded' then
      perform private.notify(new.buyer_id, 'order_refunded', 'Pul qaytarildi', 'Buyurtma bekor qilindi, to‘lov sizga qaytarildi. · ' || new.id, v_link, new.id);
      perform private.notify(v_owner, 'order_refunded', 'Buyurtma bekor qilindi', 'Platforma pulni xaridorga qaytardi. · ' || new.id, v_slink, new.id);
    end if;
  end if;
  return new;
end $$;
drop trigger if exists orders_notify on public.orders;
create trigger orders_notify after update on public.orders for each row execute function private.orders_notify();

create or replace function private.disputes_notify() returns trigger language plpgsql security definer set search_path = '' as $$
declare o public.orders; v_owner uuid;
begin
  select * into o from public.orders where id = new.order_id;
  if o.id is null then return new; end if;
  select owner_id into v_owner from public.stores where id = o.shop_id;
  perform private.notify(v_owner, 'dispute_opened', 'Buyurtma bo‘yicha nizo ochildi', 'Xaridor muammo haqida xabar berdi: ' || left(new.reason, 160) || ' · ' || o.id, '/marketplace/sotuvchi?tab=orders', o.id);
  perform private.notify(o.buyer_id, 'dispute_opened', 'Nizo qabul qilindi', 'Murojaatingiz admin ko‘rib chiqishi uchun yuborildi. Pul himoyada turadi. · ' || o.id, '/buyurtmalarim/' || o.id, o.id);
  return new;
end $$;
drop trigger if exists disputes_notify on public.disputes;
create trigger disputes_notify after insert on public.disputes for each row execute function private.disputes_notify();

-- ───────────── RPCs ─────────────
create or replace function public.sh_notifs_list(p_secret text, p_user uuid, p_limit int default 30)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  return jsonb_build_object(
    'unread', (select count(*) from public.notifications where user_id = p_user and read_at is null),
    'items', coalesce((select jsonb_agg(jsonb_build_object('id', x.id, 'type', x.type, 'title', x.title, 'body', x.body, 'link', x.link,
        'orderId', x.order_id, 'readAt', x.read_at, 'createdAt', x.created_at) order by x.created_at desc, x.id desc)
      from (select * from public.notifications where user_id = p_user order by created_at desc, id desc limit least(greatest(coalesce(p_limit, 30), 1), 100)) x), '[]'::jsonb));
end $$;

create or replace function public.sh_notifs_read(p_secret text, p_user uuid, p_ids bigint[] default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  perform private.assert_secret(p_secret);
  update public.notifications set read_at = now() where user_id = p_user and read_at is null and (p_ids is null or id = any(p_ids));
  get diagnostics n = row_count;
  return jsonb_build_object('updated', n, 'unread', (select count(*) from public.notifications where user_id = p_user and read_at is null));
end $$;

create or replace function public.sh_tg_status(p_secret text, p_user uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.profiles;
begin
  perform private.assert_secret(p_secret);
  select * into r from public.profiles where id = p_user;
  return jsonb_build_object('linked', r.tg_chat_id is not null, 'linkedAt', r.tg_linked_at);
end $$;

create or replace function public.sh_tg_link_token(p_secret text, p_user uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v text;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  delete from public.telegram_link_tokens where user_id = p_user or expires_at < now();
  v := encode(extensions.gen_random_bytes(18), 'hex');
  insert into public.telegram_link_tokens (token, user_id) values (v, p_user);
  return jsonb_build_object('token', v);
end $$;

create or replace function public.sh_tg_link(p_secret text, p_token text, p_chat bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare t public.telegram_link_tokens; v_name text;
begin
  perform private.assert_secret(p_secret);
  select * into t from public.telegram_link_tokens where token = p_token and expires_at > now();
  if t.token is null then return jsonb_build_object('ok', false); end if;
  update public.profiles set tg_chat_id = null, tg_linked_at = null where tg_chat_id = p_chat and id <> t.user_id;
  update public.profiles set tg_chat_id = p_chat, tg_linked_at = now() where id = t.user_id returning full_name into v_name;
  delete from public.telegram_link_tokens where user_id = t.user_id;
  return jsonb_build_object('ok', true, 'name', v_name);
end $$;

create or replace function public.sh_tg_unlink(p_secret text, p_user uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  update public.profiles set tg_chat_id = null, tg_linked_at = null where id = p_user;
  return jsonb_build_object('ok', true);
end $$;

-- Claim unsent notifications (≤1 day old, ≤5 attempts) of users with a linked chat.
create or replace function public.sh_notif_outbox(p_secret text, p_limit int default 25)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v jsonb;
begin
  perform private.assert_secret(p_secret);
  with picked as (
    select n.id from public.notifications n join public.profiles p on p.id = n.user_id
    where n.tg_sent_at is null and n.tg_attempts < 5 and n.created_at > now() - interval '1 day' and p.tg_chat_id is not null
    order by n.id limit least(greatest(coalesce(p_limit, 25), 1), 100) for update of n skip locked
  ), upd as (
    update public.notifications n set tg_attempts = n.tg_attempts + 1 from picked where n.id = picked.id
    returning n.id, n.title, n.body, n.link, (select p.tg_chat_id from public.profiles p where p.id = n.user_id) as chat
  )
  select coalesce(jsonb_agg(jsonb_build_object('id', u.id, 'chat', u.chat, 'title', u.title, 'body', u.body, 'link', u.link)), '[]'::jsonb) into v from upd u;
  return v;
end $$;

create or replace function public.sh_notif_tg_done(p_secret text, p_id bigint, p_ok boolean, p_unlink boolean default false)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  if p_ok then update public.notifications set tg_sent_at = now() where id = p_id; end if;
  if p_unlink then
    update public.profiles set tg_chat_id = null, tg_linked_at = null where id = (select user_id from public.notifications where id = p_id);
  end if;
end $$;

revoke all on all functions in schema private from public, anon, authenticated;
revoke execute on function public.sh_notifs_list, public.sh_notifs_read, public.sh_tg_status, public.sh_tg_link_token, public.sh_tg_link,
  public.sh_tg_unlink, public.sh_notif_outbox, public.sh_notif_tg_done from public;
grant execute on function public.sh_notifs_list, public.sh_notifs_read, public.sh_tg_status, public.sh_tg_link_token, public.sh_tg_link,
  public.sh_tg_unlink, public.sh_notif_outbox, public.sh_notif_tg_done to anon, authenticated;
