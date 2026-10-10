-- Seller UI: does the buyer also get Telegram messages? (only answers for the seller of that order)
create or replace function public.sh_order_buyer_tg(p_secret text, p_user uuid, p_order text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  return coalesce((select p.tg_chat_id is not null from public.orders o
    join public.profiles p on p.id = o.buyer_id
    join public.stores s on s.id = o.shop_id
    where o.id = p_order and s.owner_id = p_user), false);
end $$;
revoke execute on function public.sh_order_buyer_tg from public;
grant execute on function public.sh_order_buyer_tg to anon, authenticated;
