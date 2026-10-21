-- StomaHub test content: 5 items for each public section, with pictures from /public.
--
-- Run once in the Supabase SQL editor (or psql). It is safe to run again: rows that already
-- exist are skipped. Every row it adds has an id that starts with 5eed0000- (seminars: 5eed-),
-- so supabase/remove-test-content.sql deletes exactly these rows and nothing else.
--
-- What it adds: 5 owner profiles (no phone, password or e-mail, so nobody can sign in as them),
-- 2 active stores, 15 products (5 marketplace, 5 forma, 5 jihozlar), 5 ustalar, 5 laboratoriyalar,
-- 5 vakansiyalar, 5 ortiqcha material e'lonlari, 5 seminarlar, 5 community postlar, 5 kitoblar,
-- 5 kurslar (3 darsdan), 5 yangiliklar, 5 kanallar. All contact phones are 000000000.
-- Clinic CRM data (bemorlar, uchrashuvlar, to'lovlar) is private per doctor and is not seeded.
-- Surplus listings avoid medicines, which stay hidden until the legal review is done.
--
-- Uses only columns from supabase/bootstrap.sql, so it works whether or not the 20261020*
-- migrations have been applied.

begin;

-- Profiles
insert into public.profiles (id, provider, provider_uid, full_name, phone, city, specialty, avatar_url, role) values
  ('5eed0000-0000-4000-8000-000001000001', 'phone', 'stomahub-test-1', 'Sardor Rahimov', null, 'Toshkent', 'Stomatologik uskunalar muhandisi', '/img/usta/d-sardor.jpg', 'doctor'),
  ('5eed0000-0000-4000-8000-000001000002', 'phone', 'stomahub-test-2', 'Dr. Malika Yusupova', null, 'Toshkent', 'Endodontist', '/img/mobile/se-dilnoza.jpg', 'doctor'),
  ('5eed0000-0000-4000-8000-000001000003', 'phone', 'stomahub-test-3', 'Dr. Aziz Karimov', null, 'Toshkent', 'Implantolog', '/img/mobile/tl-komiljon.jpg', 'doctor'),
  ('5eed0000-0000-4000-8000-000001000004', 'phone', 'stomahub-test-4', 'Dr. Kamola Abdullayeva', null, 'Toshkent', 'Estetik stomatolog', '/img/mobile/tl-nigora.jpg', 'doctor'),
  ('5eed0000-0000-4000-8000-000001000005', 'phone', 'stomahub-test-5', 'Dr. Javohir Ahmedov', null, 'Toshkent', 'Jarroh-stomatolog', '/img/mobile/tl-azizbek.jpg', 'doctor')
on conflict (id) do nothing;

-- Stores
insert into public.stores (id, owner_id, slug, name, city, bio, phone, owner_name, logo, status, is_platform) values
  ('5eed0000-0000-4000-8000-000002000001', '5eed0000-0000-4000-8000-000001000001', 'test-dentpro-uz', 'DentPro Uz', 'Toshkent', 'Stomatologik materiallar va jihozlar rasmiy distribyutori.', '000000000', 'Sardor Rahimov', null, 'active', false),
  ('5eed0000-0000-4000-8000-000002000002', '5eed0000-0000-4000-8000-000001000002', 'test-neodental', 'NeoDental', 'Toshkent', 'Klinikalar uchun sarf materiallari va forma.', '000000000', 'Dr. Malika Yusupova', null, 'active', false)
on conflict (id) do nothing;

-- Products
insert into public.products (id, store_id, name, brand, category, price, old_price, discount, stock, delivery, description, image, kind, gender, sizes, colors, active, rating, reviews, sku, images, attrs) values
  ('5eed0000-0000-4000-8000-000003000001', '5eed0000-0000-4000-8000-000002000001', 'Filtek Z350 XT', '3M', 'materiallar', 800000, 1000000, 20, 40, 'Toshkent 24 soat', 'Nanokompozit, oldingi va chaynov tishlar uchun. 4 g shprits.', '/img/shop/m-filtek.jpg', null, null, '{}'::text[], '{}'::text[], true, 4.9, 124, 'TEST-F350', array['/img/shop/m-filtek.jpg']::text[], '{"shortDescription": "Nanokompozit (4 g)", "manufacturer": "3M (AQSh)", "volume": "4 g", "freeDelivery": true}'::jsonb),
  ('5eed0000-0000-4000-8000-000003000002', '5eed0000-0000-4000-8000-000002000001', 'OptiBond Solo Plus', 'Kerr', 'materiallar', 275000, 323529, 15, 25, 'Toshkent 24 soat', 'Universal adgeziv: emal va dentinga ishonchli yopishish, total-etch texnikasi.', '/img/shop/m-optibond.jpg', null, null, '{}'::text[], '{}'::text[], true, 4.8, 96, 'TEST-OBSP', array['/img/shop/m-optibond.jpg', '/images/product-bond.png']::text[], '{"shortDescription": "Universal adgeziv (5 ml)", "official": true, "condition": "yangi", "expiryDate": "2028-09-30", "lot": "KE3028484", "city": "Toshkent", "manufacturer": "Kerr (AQSh)", "volume": "5 ml", "usage": "Total-etch", "freeDelivery": true, "docs": [{"url": "/docs/optibond-sertifikat.pdf", "name": "Sertifikat (PDF)", "size": 1258291}, {"url": "/docs/optibond-yoriqnoma.pdf", "name": "Yo‘riqnoma (PDF)", "size": 838860}]}'::jsonb),
  ('5eed0000-0000-4000-8000-000003000003', '5eed0000-0000-4000-8000-000002000002', 'SDR flow+', 'Dentsply Sirona', 'materiallar', 382000, 450000, 15, 30, 'Toshkent 24 soat', 'Oqimli bulk-fill kompozit, 4 mm qatlam.', '/img/shop/m-sdr.jpg', null, null, '{}'::text[], '{}'::text[], true, 4.7, 68, 'TEST-SDR', array['/img/shop/m-sdr.jpg']::text[], '{"shortDescription": "Bulk-fill kompozit (2 g)"}'::jsonb),
  ('5eed0000-0000-4000-8000-000003000004', '5eed0000-0000-4000-8000-000002000001', 'ProTaper Gold', 'Dentsply', 'asboblar', 900000, null, null, 20, 'Toshkent 24 soat', 'Endodontik mashina fayllari to‘plami, 6 dona.', '/img/shop/m-protaper.jpg', null, null, '{}'::text[], '{}'::text[], true, 4.9, 72, 'TEST-PTG', array['/img/shop/m-protaper.jpg']::text[], '{"shortDescription": "Endodontik fayllar (6 dona)", "official": true}'::jsonb),
  ('5eed0000-0000-4000-8000-000003000005', '5eed0000-0000-4000-8000-000002000002', 'Fuji PLUS', 'GC', 'materiallar', 950000, 1250000, 24, 15, 'Toshkent 24 soat', 'Shisha-ionomer fiksatsiya sementi.', '/img/shop/m-fuji.jpg', null, null, '{}'::text[], '{}'::text[], true, 4.7, 52, 'TEST-FUJI', array['/img/shop/m-fuji.jpg']::text[], '{"shortDescription": "Sement (15 g)"}'::jsonb),
  ('5eed0000-0000-4000-8000-000003000006', '5eed0000-0000-4000-8000-000002000002', 'Erkaklar skrab to‘plami', 'Bestex', 'forma', 380000, 450000, 16, 25, 'Toshkent 24 soat', 'Paxta-poliester, qulay va nafas oladi.', '/images/forma/alibaba-scrub-01.jpg', 'scrub', 'erkak', array['S', 'M', 'L', 'XL', '2XL']::text[], array['teal', 'navy', 'black', 'white']::text[], true, 4.8, 120, 'TEST-FM1', array['/images/forma/alibaba-scrub-01.jpg']::text[], '{"shortDescription": "Paxta-poliester, qulay va nafas oladi"}'::jsonb),
  ('5eed0000-0000-4000-8000-000003000007', '5eed0000-0000-4000-8000-000002000002', 'Ayollar skrab to‘plami', 'Cherokee', 'forma', 420000, null, null, 25, 'Toshkent 24 soat', 'Stretch mato, antibakterial ishlov.', '/images/forma/alibaba-scrub-04.jpg', 'scrub', 'ayol', array['XS', 'S', 'M', 'L', 'XL']::text[], array['navy', 'purple', 'pushti']::text[], true, 4.9, 86, 'TEST-FM2', array['/images/forma/alibaba-scrub-04.jpg']::text[], '{"shortDescription": "Stretch mato, antibakterial"}'::jsonb),
  ('5eed0000-0000-4000-8000-000003000008', '5eed0000-0000-4000-8000-000002000002', 'Tibbiy xalat (erkaklar)', 'HNL', 'forma', 520000, null, null, 15, 'Toshkent 24 soat', 'Premium mato, klinika logosi bilan tikish mumkin.', '/img/forma/coat.jpg', 'xalat', 'erkak', array['S', 'M', 'L', 'XL', '2XL']::text[], array['white', 'navy']::text[], true, 4.7, 52, 'TEST-FM3', array['/img/forma/coat.jpg']::text[], '{"shortDescription": "Premium mato"}'::jsonb),
  ('5eed0000-0000-4000-8000-000003000009', '5eed0000-0000-4000-8000-000002000002', 'Tibbiy qalpoq', 'Bestex', 'forma', 85000, null, null, 60, 'Toshkent 24 soat', 'Paxta, o‘lchami sozlanadi.', '/img/forma/cap.jpg', 'qalpoq', 'unisex', array['Universal']::text[], array['navy', 'teal', 'purple', 'pushti']::text[], true, 4.8, 64, 'TEST-FM4', array['/img/forma/cap.jpg']::text[], '{"shortDescription": "Paxta, sozlanadigan"}'::jsonb),
  ('5eed0000-0000-4000-8000-000003000010', '5eed0000-0000-4000-8000-000002000002', 'Ayollar skrab (lavanda)', 'Bestex', 'forma', 390000, null, null, 20, 'Toshkent 24 soat', 'Yengil, tez quriydigan mato.', '/images/forma/alibaba-scrub-09.jpg', 'scrub', 'ayol', array['XS', 'S', 'M', 'L', 'XL']::text[], array['purple', 'teal', 'pushti']::text[], true, 4.8, 95, 'TEST-FM5', array['/images/forma/alibaba-scrub-09.jpg']::text[], '{"shortDescription": "Yengil, tez quriydigan"}'::jsonb),
  ('5eed0000-0000-4000-8000-000003000011', '5eed0000-0000-4000-8000-000002000001', 'Stomatologik ustanovka A7', 'Anthos', 'jihozlar', 185000000, null, null, 3, 'Toshkent 24 soat', 'Pastki shlangli ustanovka, LED chiroq, o‘rnatish va o‘qitish kiritilgan.', '/img/jihoz/d-anthos-a7.jpg', null, null, '{}'::text[], '{}'::text[], true, 4.9, 18, 'TEST-JZ1', array['/img/jihoz/d-anthos-a7.jpg']::text[], '{"specLine": "Pastki shlangli, LED chiroq", "condition": "yangi", "year": 2026, "warrantyMonths": 24, "installmentMonths": 12, "installService": true, "official": true}'::jsonb),
  ('5eed0000-0000-4000-8000-000003000012', '5eed0000-0000-4000-8000-000002000001', 'Avtoklav Class B 18 L', 'Woson', 'jihozlar', 15950000, null, null, 6, 'Toshkent 24 soat', '18 litrli B sinf avtoklav, printer bilan.', '/img/jihoz/autoclave.jpg', null, null, '{}'::text[], '{}'::text[], true, 4.7, 28, 'TEST-JZ2', array['/img/jihoz/autoclave.jpg']::text[], '{"specLine": "18 litr, B sinf, printer", "condition": "yangi", "year": 2026, "warrantyMonths": 12, "installmentMonths": 6}'::jsonb),
  ('5eed0000-0000-4000-8000-000003000013', '5eed0000-0000-4000-8000-000002000001', 'Kompressor DA370', 'Diplomat', 'jihozlar', 12400000, null, null, 4, 'Toshkent 24 soat', 'Moysiz kompressor, 2 ustanovka uchun.', '/img/jihoz/d-diplomat-da370.jpg', null, null, '{}'::text[], '{}'::text[], true, 4.8, 21, 'TEST-JZ3', array['/img/jihoz/d-diplomat-da370.jpg']::text[], '{"specLine": "Moysiz, 2 ustanovka uchun", "condition": "yangi", "year": 2025, "warrantyMonths": 24, "installService": true}'::jsonb),
  ('5eed0000-0000-4000-8000-000003000014', '5eed0000-0000-4000-8000-000002000001', 'Polimerizatsion lampa Bluephase N', 'Ivoclar', 'jihozlar', 4200000, null, null, 10, 'Toshkent 24 soat', '1200 mW/sm² simsiz lampa.', '/img/jihoz/d-bluephase-n.jpg', null, null, '{}'::text[], '{}'::text[], true, 4.9, 40, 'TEST-JZ4', array['/img/jihoz/d-bluephase-n.jpg']::text[], '{"specLine": "1200 mW/sm², simsiz", "condition": "yangi", "year": 2026, "warrantyMonths": 24, "official": true}'::jsonb),
  ('5eed0000-0000-4000-8000-000003000015', '5eed0000-0000-4000-8000-000002000001', 'Stomatologik kreslo (ishlatilgan)', 'Fengdan', 'jihozlar', 42900000, null, null, 1, 'Toshkent 24 soat', '2022 yilgi kreslo, to‘liq ishlaydi, servisdan o‘tgan.', '/img/jihoz/chair2.jpg', null, null, '{}'::text[], '{}'::text[], true, 4.6, 9, 'TEST-JZ5', array['/img/jihoz/chair2.jpg']::text[], '{"specLine": "2022, servisdan o‘tgan", "condition": "ishlatilgan", "year": 2022, "warrantyMonths": 6}'::jsonb)
on conflict (id) do nothing;

-- Ustalar
insert into public.masters (id, owner_id, kind, name, title, services, city, district, years, description, photo, works, phone, telegram, status) values
  ('5eed0000-0000-4000-8000-000004000001', '5eed0000-0000-4000-8000-000001000001', 'usta', 'Sardor Rahimov', 'Stomatologik uskunalar muhandisi', array['kreslo', 'tamirlash', 'ornatish']::text[], 'Toshkent', 'Chilonzor', 9, 'Stomatologik uskunalar muhandisi. Toshkent bo‘ylab chiqib ishlayman, ish kafolati bilan.', '/img/usta/d-sardor.jpg', array['/img/usta/d-work-1.jpg', '/img/usta/d-work-2.jpg']::text[], '000000000', null, 'published'),
  ('5eed0000-0000-4000-8000-000004000002', '5eed0000-0000-4000-8000-000001000002', 'usta', 'Dilshod Mavlonov', 'Rentgen va CBCT mutaxassisi', array['rentgen', 'ornatish']::text[], 'Toshkent', 'Yunusobod', 7, 'Rentgen va CBCT mutaxassisi. Toshkent bo‘ylab chiqib ishlayman, ish kafolati bilan.', '/img/usta/d-dilshod.jpg', array['/img/usta/d-work-3.jpg']::text[], '000000000', null, 'published'),
  ('5eed0000-0000-4000-8000-000004000003', '5eed0000-0000-4000-8000-000001000003', 'usta', 'Azamat Iskandarov', 'Avtoklav va sterilizatsiya uskunalari', array['tamirlash', 'servis']::text[], 'Toshkent', 'Mirzo Ulug‘bek', 6, 'Avtoklav va sterilizatsiya uskunalari. Toshkent bo‘ylab chiqib ishlayman, ish kafolati bilan.', '/img/usta/d-azamat.jpg', array['/img/usta/d-work-4.jpg']::text[], '000000000', null, 'published'),
  ('5eed0000-0000-4000-8000-000004000004', '5eed0000-0000-4000-8000-000001000004', 'usta', 'Bobur Qodirov', 'Uchliklar va mikroskop ta’miri', array['tamirlash', 'konsultatsiya']::text[], 'Toshkent', 'Shayxontohur', 10, 'Uchliklar va mikroskop ta’miri. Toshkent bo‘ylab chiqib ishlayman, ish kafolati bilan.', '/img/usta/d-bobur.jpg', array['/img/usta/d-work-5.jpg']::text[], '000000000', null, 'published'),
  ('5eed0000-0000-4000-8000-000004000005', '5eed0000-0000-4000-8000-000001000005', 'usta', 'Jasur Tursunov', 'Kreslo va kompressor ustasi', array['kreslo', 'servis']::text[], 'Toshkent', 'Sergeli', 5, 'Kreslo va kompressor ustasi. Toshkent bo‘ylab chiqib ishlayman, ish kafolati bilan.', '/img/usta/d-jasur.jpg', array['/img/usta/d-work-6.jpg']::text[], '000000000', null, 'published')
on conflict (id) do nothing;

-- Laboratoriyalar
insert into public.labs (id, owner_id, name, city, district, services, materials, description, days, price_from, photo, photos, years, courier, phone, telegram, status) values
  ('5eed0000-0000-4000-8000-000005000001', '5eed0000-0000-4000-8000-000001000001', 'Oq Tabassum Dental Lab', 'Toshkent', 'Yunusobod', array['crown', 'veneer', 'cadcam']::text[], array['zirconia', 'emax']::text[], 'Oq Tabassum Dental Lab: sirkoniy va E.max tojlar, vinirlar, implant usti konstruksiyalar. Kuryer xizmati bor.', 7, 450000, '/img/hub/case-a1.jpg', array['/img/hub/case-a1.jpg']::text[], 4, 'ha', '000000000', null, 'published'),
  ('5eed0000-0000-4000-8000-000005000002', '5eed0000-0000-4000-8000-000001000002', 'Smile Craft Lab', 'Toshkent', 'Chilonzor', array['crown', 'bridge', 'implant']::text[], array['zirconia', 'metal-ceramic']::text[], 'Smile Craft Lab: sirkoniy va E.max tojlar, vinirlar, implant usti konstruksiyalar. Kuryer xizmati bor.', 5, 380000, '/img/hub/case-a2.jpg', array['/img/hub/case-a2.jpg']::text[], 5, 'ha', '000000000', null, 'published'),
  ('5eed0000-0000-4000-8000-000005000003', '5eed0000-0000-4000-8000-000001000003', 'ProDent Laboratoriya', 'Toshkent', 'Mirobod', array['removable', 'crown']::text[], array['metal-ceramic', 'premium']::text[], 'ProDent Laboratoriya: sirkoniy va E.max tojlar, vinirlar, implant usti konstruksiyalar. Kuryer xizmati bor.', 10, 300000, '/img/hub/case-a3.jpg', array['/img/hub/case-a3.jpg']::text[], 6, 'ha', '000000000', null, 'published'),
  ('5eed0000-0000-4000-8000-000005000004', '5eed0000-0000-4000-8000-000001000004', 'Digital Dent Studio', 'Toshkent', 'Mirzo Ulug‘bek', array['cadcam', 'veneer', 'implant']::text[], array['zirconia', 'emax', 'premium']::text[], 'Digital Dent Studio: sirkoniy va E.max tojlar, vinirlar, implant usti konstruksiyalar. Kuryer xizmati bor.', 5, 520000, '/img/hub/case-a4.jpg', array['/img/hub/case-a4.jpg']::text[], 7, 'ha', '000000000', null, 'published'),
  ('5eed0000-0000-4000-8000-000005000005', '5eed0000-0000-4000-8000-000001000005', 'Samarqand Dental Lab', 'Samarqand', 'Markaz', array['crown', 'bridge']::text[], array['zirconia', 'metal-ceramic']::text[], 'Samarqand Dental Lab: sirkoniy va E.max tojlar, vinirlar, implant usti konstruksiyalar. Kuryer xizmati bor.', 7, 280000, '/img/hub/case-b1.jpg', array['/img/hub/case-b1.jpg']::text[], 8, 'ha', '000000000', null, 'published')
on conflict (id) do nothing;

-- Ishlar
insert into public.jobs (id, owner_id, title, clinic, city, district, salary_min, salary_max, job_type, experience_years, remote, description, phone, category, photos, logo, status, approved_at, created_at) values
  ('5eed0000-0000-4000-8000-000006000001', '5eed0000-0000-4000-8000-000001000001', 'Ortoped stomatolog', 'Smile Dental Clinic', 'Toshkent', 'Yunusobod', 12000000, 18000000, 'full', 3, false, 'Zamonaviy klinikada ortoped stomatolog kerak. Implant va protetik yo‘nalishda tajribali shifokor, rasmiy ishga joylashish.', '000000000', 'shifokor', array['/img/jobs/d-smile.jpg']::text[], '/img/jobs/d-logo-1.jpg', 'published', now() - interval '2 days', now() - interval '2 days'),
  ('5eed0000-0000-4000-8000-000006000002', '5eed0000-0000-4000-8000-000001000002', 'Terapevt stomatolog', 'DentaCare', 'Toshkent', 'Chilonzor', 8000000, 12000000, 'full', 1, false, 'Klinikamizga terapevt stomatolog kerak. Zamonaviy jihozlar, doimiy bemorlar oqimi, malaka oshirish kurslari.', '000000000', 'shifokor', array['/img/jobs/d-dentacare.jpg']::text[], '/img/jobs/d-logo-2.jpg', 'published', now() - interval '1 days', now() - interval '1 days'),
  ('5eed0000-0000-4000-8000-000006000003', '5eed0000-0000-4000-8000-000001000003', 'Bolalar stomatologi', 'Family Dental', 'Toshkent', 'Mirzo Ulug‘bek', 10000000, 15000000, 'full', 3, false, 'Bolalar bilan ishlash tajribasiga ega, mehribon va mas’uliyatli shifokor izlaymiz.', '000000000', 'shifokor', array['/img/jobs/d-family.jpg']::text[], '/img/jobs/d-logo-3.jpg', 'published', now() - interval '3 days', now() - interval '3 days'),
  ('5eed0000-0000-4000-8000-000006000004', '5eed0000-0000-4000-8000-000001000004', 'Jarroh-implantolog', 'Implant Plus', 'Toshkent', 'Shayxontohur', 18000000, 25000000, 'part', 5, false, 'Implantolog jarroh kerak, haftada 3 kun. Straumann va Nobel tizimlari bilan ishlash tajribasi afzal.', '000000000', 'shifokor', array['/img/jobs/d-implant.jpg']::text[], '/img/jobs/d-logo-4.jpg', 'published', now() - interval '4 days', now() - interval '4 days'),
  ('5eed0000-0000-4000-8000-000006000005', '5eed0000-0000-4000-8000-000001000005', 'Stomatolog assistenti', 'City Dental', 'Toshkent', 'Olmazor', 4000000, 6000000, 'shift', 0, false, 'Stomatolog assistenti lavozimiga tanlov. Tajriba shart emas, ish joyida o‘qitamiz.', '000000000', 'klinika', array['/img/jobs/d-city.jpg']::text[], '/img/jobs/d-logo-5.jpg', 'published', now() - interval '7 days', now() - interval '7 days')
on conflict (id) do nothing;

-- Ortiqcha material
insert into public.surplus_listings (id, owner_id, name, brand, category, price, new_price, pkg, expiry_months, city, district, phone, telegram, image, images, note, description, status, approved_at, created_at) values
  ('5eed0000-0000-4000-8000-000007000001', '5eed0000-0000-4000-8000-000001000001', 'Filtek Z350 XT A2', '3M', 'kompozit', 420000, 800000, 'yopiq', 14, 'Toshkent', 'Chilonzor', '000000000', null, '/img/mobile/om-filtek-box.jpg', array['/img/mobile/om-filtek-box.jpg']::text[], 'Klinikamizda ortib qoldi, saqlash shartlariga rioya qilingan.', 'Filtek Z350 XT A2: qadoq yopiq, yaroqlilik muddati qadoqda ko‘rsatilgan.', 'published', now() - interval '1 days', now() - interval '1 days'),
  ('5eed0000-0000-4000-8000-000007000002', '5eed0000-0000-4000-8000-000001000002', 'OptiBond Solo Plus 5 ml', 'Kerr', 'bonding', 160000, 275000, 'yopiq', 10, 'Toshkent', 'Yunusobod', '000000000', null, '/img/mobile/mk-opti-pack.jpg', array['/img/mobile/mk-opti-pack.jpg']::text[], 'Klinikamizda ortib qoldi, saqlash shartlariga rioya qilingan.', 'OptiBond Solo Plus 5 ml: qadoq yopiq, yaroqlilik muddati qadoqda ko‘rsatilgan.', 'published', now() - interval '2 days', now() - interval '2 days'),
  ('5eed0000-0000-4000-8000-000007000003', '5eed0000-0000-4000-8000-000001000003', 'ProTaper Gold F2', 'Dentsply', 'endodontiya', 480000, 900000, 'ochilgan', 18, 'Toshkent', 'Mirzo Ulug‘bek', '000000000', null, '/img/mobile/om-protaper.jpg', array['/img/mobile/om-protaper.jpg']::text[], 'Klinikamizda ortib qoldi, saqlash shartlariga rioya qilingan.', 'ProTaper Gold F2: qadoq ochilgan, ishlatilmagan qismi, yaroqlilik muddati qadoqda ko‘rsatilgan.', 'published', now() - interval '3 days', now() - interval '3 days'),
  ('5eed0000-0000-4000-8000-000007000004', '5eed0000-0000-4000-8000-000001000004', 'RelyX U200', '3M', 'sement', 650000, 1200000, 'yopiq', 8, 'Toshkent', 'Yakkasaroy', '000000000', null, '/img/mobile/om-relyx.jpg', array['/img/mobile/om-relyx.jpg']::text[], 'Klinikamizda ortib qoldi, saqlash shartlariga rioya qilingan.', 'RelyX U200: qadoq yopiq, yaroqlilik muddati qadoqda ko‘rsatilgan.', 'published', now() - interval '4 days', now() - interval '4 days'),
  ('5eed0000-0000-4000-8000-000007000005', '5eed0000-0000-4000-8000-000001000005', 'Straumann BLT implant 4.1', 'Straumann', 'implantlar', 2900000, 4500000, 'yopiq', 30, 'Toshkent', 'Sergeli', '000000000', null, '/img/implant.jpg', array['/img/implant.jpg']::text[], 'Klinikamizda ortib qoldi, saqlash shartlariga rioya qilingan.', 'Straumann BLT implant 4.1: qadoq yopiq, yaroqlilik muddati qadoqda ko‘rsatilgan.', 'published', now() - interval '5 days', now() - interval '5 days')
on conflict (id) do nothing;

-- Seminarlar
insert into public.seminars (id, organizer_id, source, status, title, description, speakers, event_date, start_time, end_time, city, venue, price, seats_total, specialty, image, tags, program, learnings) values
  ('5eed-implantdan-tojgacha', '5eed0000-0000-4000-8000-000001000001', 'user', 'published', 'Implantologiya: implantdan tojgacha', 'Diagnostika, jarrohlik protokoli va implant usti protezlash bo‘yicha amaliy seminar.', '[{"name": "Dr. Aziz Karimov", "role": "Implantolog, PhD"}]'::jsonb, current_date + 7, '10:00', '18:00', 'Toshkent shahri', 'Hyatt Regency, konferens-zal', 1200000, 30, 'implantologiya', '/img/seminars/s1.jpg', array['CME']::text[], '[{"time": "10:00", "title": "Ro‘yxatdan o‘tish va qahva"}, {"time": "11:00", "title": "Nazariy qism"}, {"time": "14:00", "title": "Amaliy mashg‘ulot"}, {"time": "18:00", "title": "Savol-javob va sertifikat"}]'::jsonb, array['Zamonaviy protokollar', 'Klinik holatlar tahlili', 'Amaliy ko‘nikmalar']::text[]),
  ('5eed-mikroskop-endo', '5eed0000-0000-4000-8000-000001000001', 'user', 'published', 'Mikroskop yordamida endodontik davolash', 'Mikroskopda ishlash protokoli va murakkab kanallar bo‘yicha klinik holatlar.', '[{"name": "Dr. Malika Yusupova", "role": "Endodontist"}]'::jsonb, current_date + 12, '09:00', '17:00', 'Samarqand', 'Hilton Garden Inn', 850000, 25, 'endodontiya', '/img/seminars/s2.jpg', array['CME']::text[], '[{"time": "09:00", "title": "Ro‘yxatdan o‘tish va qahva"}, {"time": "11:00", "title": "Nazariy qism"}, {"time": "14:00", "title": "Amaliy mashg‘ulot"}, {"time": "17:00", "title": "Savol-javob va sertifikat"}]'::jsonb, array['Zamonaviy protokollar', 'Klinik holatlar tahlili', 'Amaliy ko‘nikmalar']::text[]),
  ('5eed-sinus-lifting', '5eed0000-0000-4000-8000-000001000001', 'user', 'published', 'Sinus lifting va vertikal augmentatsiya', 'Amaliy mashg‘ulot va jonli jarrohlik namoyishi.', '[{"name": "Dr. Javohir Ahmedov", "role": "Jarroh, implantolog"}]'::jsonb, current_date + 18, '10:00', '18:00', 'Toshkent shahri', 'Nexus Clinic', 2500000, 20, 'implantologiya', '/img/seminars/s3.jpg', array['CME']::text[], '[{"time": "10:00", "title": "Ro‘yxatdan o‘tish va qahva"}, {"time": "11:00", "title": "Nazariy qism"}, {"time": "14:00", "title": "Amaliy mashg‘ulot"}, {"time": "18:00", "title": "Savol-javob va sertifikat"}]'::jsonb, array['Zamonaviy protokollar', 'Klinik holatlar tahlili', 'Amaliy ko‘nikmalar']::text[]),
  ('5eed-kompozit-oldingi', '5eed0000-0000-4000-8000-000001000001', 'user', 'published', 'Kompozit restavratsiya: oldingi tishlar', 'To‘g‘ridan-to‘g‘ri va bilvosita restavratsiya texnikalari.', '[{"name": "Dr. Kamola Abdullayeva", "role": "Estetik stomatolog"}]'::jsonb, current_date + 25, '09:00', '16:00', 'Toshkent shahri', 'Dentalion Center', 1000000, 40, 'estetika', '/img/seminars/s4.jpg', array['CME']::text[], '[{"time": "09:00", "title": "Ro‘yxatdan o‘tish va qahva"}, {"time": "11:00", "title": "Nazariy qism"}, {"time": "14:00", "title": "Amaliy mashg‘ulot"}, {"time": "16:00", "title": "Savol-javob va sertifikat"}]'::jsonb, array['Zamonaviy protokollar', 'Klinik holatlar tahlili', 'Amaliy ko‘nikmalar']::text[]),
  ('5eed-aligner-case', '5eed0000-0000-4000-8000-000001000001', 'user', 'published', 'Aligner terapiya: case selection', 'Klinik holatlarni tanlash va davolash rejasi.', '[{"name": "Dr. Farrux Xaydarov", "role": "Ortodont"}]'::jsonb, current_date + 32, '09:00', '16:00', 'Toshkent shahri', 'City Congress Hall', 900000, 40, 'ortodontiya', '/img/seminars/s5.jpg', array['CME']::text[], '[{"time": "09:00", "title": "Ro‘yxatdan o‘tish va qahva"}, {"time": "11:00", "title": "Nazariy qism"}, {"time": "14:00", "title": "Amaliy mashg‘ulot"}, {"time": "16:00", "title": "Savol-javob va sertifikat"}]'::jsonb, array['Zamonaviy protokollar', 'Klinik holatlar tahlili', 'Amaliy ko‘nikmalar']::text[])
on conflict (id) do nothing;

-- Community
insert into public.community_posts (id, author_id, kind, title, body, tags, images, created_at) values
  ('5eed0000-0000-4000-8000-000008000001', '5eed0000-0000-4000-8000-000001000001', 'case', '36-tish: surunkali apikal periodontit, qayta endodontik davolash', '36-tish: surunkali apikal periodontit, qayta endodontik davolash
Bemor 36-tishda og‘riq bilan murojaat qildi. Avvalgi davolash sifatsiz bo‘lgan. Mikroskop ostida qayta endodontik davolash o‘tkazildi, rentgen nazorati ilova qilindi.', array['Endodontiya', 'Mikroskop']::text[], array['/img/mobile/tl-endo.jpg', '/images/seminar-xray.png']::text[], now() - interval '2 days'),
  ('5eed0000-0000-4000-8000-000008000002', '5eed0000-0000-4000-8000-000001000002', 'case', 'Sinus lifting va implant: 6 oylik natija', 'Sinus lifting va implant: 6 oylik natija
Chap yuqori jag‘da suyak yetishmovchiligi tufayli sinus lifting va implantatsiya bajarildi. 6 oylik nazoratda barqaror natija.', array['Implantologiya']::text[], array['/img/mobile/tl-implant.jpg', '/img/seminars/s3.jpg']::text[], now() - interval '5 days'),
  ('5eed0000-0000-4000-8000-000008000003', '5eed0000-0000-4000-8000-000001000003', 'savol', 'Oldingi tishlar uchun qaysi bondni tavsiya qilasiz?', 'Oldingi tishlar uchun qaysi bondni tavsiya qilasiz?
Estetik restavratsiyada universal bond va total-etch orasida tanlov qilyapman. Tajribangiz qanday?', array['Estetika']::text[], '{}'::text[], now() - interval '8 days'),
  ('5eed0000-0000-4000-8000-000008000004', '5eed0000-0000-4000-8000-000001000004', 'case', 'Aligner bilan diastemani yopish: 4 oylik kuzatuv', 'Aligner bilan diastemani yopish: 4 oylik kuzatuv
Bemor 24 yosh, yuqori markaziy diastema 2,5 mm. Aligner terapiyasi bosqichlari va natijasi.', array['Ortodontiya']::text[], array['/img/mobile/tl-braces.jpg']::text[], now() - interval '11 days'),
  ('5eed0000-0000-4000-8000-000008000005', '5eed0000-0000-4000-8000-000001000005', 'yangilik', 'Toshkentda raqamli stomatologiya bo‘yicha kongress', 'Toshkentda raqamli stomatologiya bo‘yicha kongress
Noyabr oyida CAD/CAM va intraoral skanerlar bo‘yicha amaliy master-klasslar bo‘ladi.', array['Yangilik']::text[], array['/img/seminars/hero.jpg']::text[], now() - interval '13 days')
on conflict (id) do nothing;

-- Kitoblar
insert into public.books (id, title, author, cover, description, price, chapters, published) values
  ('5eed0000-0000-4000-8000-000009000001', 'Contemporary Implant Dentistry', 'Carl E. Misch', '/img/hub/book-1.jpg', 'Implantologiya bo‘yicha asosiy qo‘llanma.', 420000, '[{"title": "1-bob", "body": "Bob matni."}, {"title": "2-bob", "body": "Bob matni."}, {"title": "3-bob", "body": "Bob matni."}]'::jsonb, true),
  ('5eed0000-0000-4000-8000-000009000002', 'Pathways of the Pulp', 'Kenneth M. Hargreaves', '/img/hub/book-2.jpg', 'Endodontiya klassikasi.', 480000, '[{"title": "1-bob", "body": "Bob matni."}, {"title": "2-bob", "body": "Bob matni."}, {"title": "3-bob", "body": "Bob matni."}]'::jsonb, true),
  ('5eed0000-0000-4000-8000-000009000003', 'Fundamentals of Fixed Prosthodontics', 'Herbert T. Shillingburg', '/img/hub/book-3.jpg', 'Ortopedik stomatologiya asoslari.', 450000, '[{"title": "1-bob", "body": "Bob matni."}, {"title": "2-bob", "body": "Bob matni."}, {"title": "3-bob", "body": "Bob matni."}]'::jsonb, true),
  ('5eed0000-0000-4000-8000-000009000004', 'Contemporary Orthodontics', 'William R. Proffit', '/img/hub/book-4.jpg', 'Zamonaviy ortodontiya.', 520000, '[{"title": "1-bob", "body": "Bob matni."}, {"title": "2-bob", "body": "Bob matni."}, {"title": "3-bob", "body": "Bob matni."}]'::jsonb, true),
  ('5eed0000-0000-4000-8000-000009000005', 'Terapevtik stomatologiya', 'Mualliflar jamoasi', '/img/hub/book-5.jpg', 'O‘zbek tilidagi o‘quv qo‘llanma.', 0, '[{"title": "1-bob", "body": "Bob matni."}, {"title": "2-bob", "body": "Bob matni."}, {"title": "3-bob", "body": "Bob matni."}]'::jsonb, true)
on conflict (id) do nothing;

-- Kurslar
insert into public.courses (id, title, teacher, cover, description, price, published) values
  ('5eed0000-0000-4000-8000-000010000001', 'Implantologiya: boshlang‘ich kurs', 'Dr. Aziz Karimov', '/img/hub/course-1.jpg', 'Implant rejalashtirishdan protezlashgacha.', 1500000, true),
  ('5eed0000-0000-4000-8000-000010000002', 'Mikroskopik endodontiya', 'Dr. Malika Yusupova', '/img/hub/course-2.jpg', 'Mikroskop bilan kanal davolash.', 1200000, true),
  ('5eed0000-0000-4000-8000-000010000003', 'Kompozit restavratsiya mahorati', 'Dr. Kamola Abdullayeva', '/img/hub/course-3.jpg', 'Oldingi va chaynov tishlar.', 900000, true),
  ('5eed0000-0000-4000-8000-000010000004', 'Ortodontiyada aligner terapiya', 'Dr. Farrux Xaydarov', '/img/hub/course-4.jpg', 'Case selection va rejalashtirish.', 1100000, true),
  ('5eed0000-0000-4000-8000-000010000005', 'Klinika marketingi', 'Aziza Tursunova', '/img/hub/course-5.jpg', 'Bemor oqimini oshirish.', 0, true)
on conflict (id) do nothing;

-- Kurs darslari
insert into public.course_lessons (id, course_id, position, title, video_url) values
  ('5eed0000-0000-4000-8000-000011000001', '5eed0000-0000-4000-8000-000010000001', 1, '1-dars', null),
  ('5eed0000-0000-4000-8000-000011000002', '5eed0000-0000-4000-8000-000010000001', 2, '2-dars', null),
  ('5eed0000-0000-4000-8000-000011000003', '5eed0000-0000-4000-8000-000010000001', 3, '3-dars', null),
  ('5eed0000-0000-4000-8000-000011000011', '5eed0000-0000-4000-8000-000010000002', 1, '1-dars', null),
  ('5eed0000-0000-4000-8000-000011000012', '5eed0000-0000-4000-8000-000010000002', 2, '2-dars', null),
  ('5eed0000-0000-4000-8000-000011000013', '5eed0000-0000-4000-8000-000010000002', 3, '3-dars', null),
  ('5eed0000-0000-4000-8000-000011000021', '5eed0000-0000-4000-8000-000010000003', 1, '1-dars', null),
  ('5eed0000-0000-4000-8000-000011000022', '5eed0000-0000-4000-8000-000010000003', 2, '2-dars', null),
  ('5eed0000-0000-4000-8000-000011000023', '5eed0000-0000-4000-8000-000010000003', 3, '3-dars', null),
  ('5eed0000-0000-4000-8000-000011000031', '5eed0000-0000-4000-8000-000010000004', 1, '1-dars', null),
  ('5eed0000-0000-4000-8000-000011000032', '5eed0000-0000-4000-8000-000010000004', 2, '2-dars', null),
  ('5eed0000-0000-4000-8000-000011000033', '5eed0000-0000-4000-8000-000010000004', 3, '3-dars', null),
  ('5eed0000-0000-4000-8000-000011000041', '5eed0000-0000-4000-8000-000010000005', 1, '1-dars', null),
  ('5eed0000-0000-4000-8000-000011000042', '5eed0000-0000-4000-8000-000010000005', 2, '2-dars', null),
  ('5eed0000-0000-4000-8000-000011000043', '5eed0000-0000-4000-8000-000010000005', 3, '3-dars', null)
on conflict (id) do nothing;

-- Yangiliklar
insert into public.news_posts (id, title, cover, body, tags, published_at, published) values
  ('5eed0000-0000-4000-8000-000012000001', 'Toshkentda Dental Expo 2026 ko‘rgazmasi bo‘lib o‘tadi', '/img/news/expo.jpg', 'Ko‘rgazmada 120 dan ortiq ishlab chiqaruvchi qatnashadi.', array['tadbirlar']::text[], now() - interval '1 days', true),
  ('5eed0000-0000-4000-8000-000012000002', 'Intraoral skanerlar narxi pasaymoqda', '/img/news/n1.jpg', 'Raqamli stomatologiya bozori tahlili.', array['texnologiya']::text[], now() - interval '2 days', true),
  ('5eed0000-0000-4000-8000-000012000003', 'Yangi implant tizimi ro‘yxatdan o‘tdi', '/img/news/n2.jpg', 'Sertifikatlash jarayoni yakunlandi.', array['soha']::text[], now() - interval '4 days', true),
  ('5eed0000-0000-4000-8000-000012000004', 'Bioceramic sementlar: tadqiqot natijalari', '/img/news/n3.jpg', 'Klinik kuzatuv natijalari e’lon qilindi.', array['soha']::text[], now() - interval '6 days', true),
  ('5eed0000-0000-4000-8000-000012000005', 'Malaka oshirish kurslari kalendari', '/img/news/n4.jpg', 'Noyabr va dekabr oylari uchun jadval.', array['tadbirlar']::text[], now() - interval '8 days', true)
on conflict (id) do nothing;

-- Kanallar
insert into public.channels (id, owner_id, username, name, category, avatar_color) values
  ('5eed0000-0000-4000-8000-000013000001', null, 'implant_uz_test', 'Implantologiya Uzbekistan', 'implantologiya', '#0fa6a0'),
  ('5eed0000-0000-4000-8000-000013000002', null, 'endo_club_test', 'Endo Club', 'endodontiya', '#2f6bff'),
  ('5eed0000-0000-4000-8000-000013000003', null, 'ortho_talk_test', 'Ortho Talk', 'ortodontiya', '#7c4dff'),
  ('5eed0000-0000-4000-8000-000013000004', null, 'dental_marketing_test', 'Dental Marketing', 'marketing', '#f08a24'),
  ('5eed0000-0000-4000-8000-000013000005', null, 'stomatolog_kaliti_test', 'Stomatolog kaliti', 'umumiy', '#e0322f')
on conflict (id) do nothing;

commit;
