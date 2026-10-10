-- StomaHub — bir martalik: ro‘yxatdan o‘tgan foydalanuvchini ADMIN (owner) qilish.
--
-- Ishlatish: foydalanuvchi saytda shu telefon raqam bilan ro‘yxatdan o‘tgan bo‘lishi kerak
-- (https://stomatolog-kaliti-lake.vercel.app/kirish). Quyidagi v_phone ni 9 xonali raqamga
-- almashtiring (masalan +998 90 123 45 67 → '901234567') va Supabase SQL Editor'da ishga tushiring.
--
-- Nima qiladi:
--   1) profiles.is_admin = true, admin_role = 'owner' (ADMIN_* env orqali avtomatik tayinlash bilan bir xil);
--   2) audit_log'ga 'admin.owner_bootstrap' (matchedBy = 'script') yozadi;
--   3) "StomaHub Market" platforma do‘konini shu adminga biriktiradi (statik mahsulot buyurtmalari
--      /marketplace/sotuvchi → Buyurtmalar bo‘limida shu admin akkauntida chiqadi).
-- Xavfsizlik: bu funksiya EMAS, oddiy bir martalik skript — public RPC sifatida ochilmagan.
-- Teskarisi: update public.profiles set is_admin = false, admin_role = null where phone = '<raqam>';

do $$
declare
  v_phone text := '000000000';          -- ← SHU YERGA 9 xonali telefon raqamni yozing
  v_id uuid;
begin
  if v_phone !~ '^\d{9}$' or v_phone = '000000000' then
    raise exception 'v_phone ni 9 xonali telefon raqamga almashtiring';
  end if;
  select id into v_id from public.profiles where phone = v_phone and provider = 'phone' and blocked_at is null;
  if v_id is null then
    raise exception 'Bu telefon bilan ro‘yxatdan o‘tgan profil topilmadi (%). Avval saytda ro‘yxatdan o‘ting.', v_phone;
  end if;
  update public.profiles set is_admin = true, admin_role = 'owner', updated_at = now() where id = v_id;
  perform private.audit(v_id, 'admin.owner_bootstrap', 'profile', v_id::text, jsonb_build_object('matchedBy', 'script'));
  perform private.claim_platform_store(v_id);
  raise notice 'Admin tayyor: % (profil %)', v_phone, v_id;
end $$;
