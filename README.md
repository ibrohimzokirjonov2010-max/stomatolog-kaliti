# StomaHub

Toshkentdagi stomatologlar uchun desktop-first lifestyle dashboard: marketplace, seminarlar, ta’lim va klinika marketingi. Bu MVP — to‘lov, ombor va haqiqiy CRM yo‘q.

## Ishga tushirish

```bash
npm install
npm run dev
```

Brauzer: [http://127.0.0.1:43211](http://127.0.0.1:43211)

Keng oynada oching (≈1280–1440px). Chap menyu va yuqori qidiruv — asosiy boshqaruv. Kichik ekranda pastki tab va hamburger menyu.

## Nima ishlaydi

- **Bosh sahifa** (`/` yoki `/bosh-sahifa`) — desktop dashboard: seminarlar `/seminarlar` katalogidan, takliflar Marketplace mahsulotlaridan, community lenta, tezkor yo‘llar, video darslar `/talim`. Mobil (iPhone portret): qidiruv, ixcham hero, gorizontal seminarlar, 2×4 tezkor yo‘llar, vertikal Maxsus takliflar (Savatga), Community snippet, marketing banner; pastki tab Bosh / Marketplace / Ustalar / Seminarlar / Profil.
- **Ortiqcha material** (`/ortiqcha-material`) — doktordan doktorga shaxsiy ortiqcha. Filtrlar (kategoriya, Yopiq/Ochilgan, muddat, shahar, narx) lentani kesadi. **E’lon joylash**: nom, brend, kategoriya, holat va yaroqlilik muddati majburiy, narx, shahar, telefon/Telegram, ixtiyoriy rasm URL, izoh — `localStorage`da saqlanadi, sotuvchi «Siz · Dr. Azizbek». Ulgurji/diler ohangi shaxsiy izohsiz bloklanadi. **Mening e’lonlarim** `/ortiqcha-material/elonlarim` — tahrirlash, faolsizlantirish, o‘chirish. **Bog‘lanish**: `tel:` / Telegram + xabar namunasi, qiziqish jurnali. **Savatga** ixtiyoriy (`ortiqcha` + muddat). Ishonch stripi saqlanadi.
- **Marketplace** (`/marketplace`) — platforma katalogi (`src/data`) + tasdiqlangan do‘konlarning mahsulotlari (Supabase). **Sotuvchi bo‘lish** `/marketplace/sotuvchi`: akkauntga bog‘langan ariza (STIR, hujjat — private `seller-docs` bucket) → admin tasdig‘i → mahsulot qo‘shish (rasm Storage’ga yuklanadi). Buyurtmalar, statuslar, escrow va nizolar DB’da. Karta ulash hozircha brauzerda (demo).
- **Mahsulot** (`/marketplace/[slug]`, qisqa yo‘l `/product/[id]`) — galereya, miqdor, savat, sevimlilar, tablari, o‘xshash mahsulotlar
- **Savat** (`/savat`, `/cart`) — qatorlar, miqdor, o‘chirish, jami so‘m, xaridni davom ettirish
- **Buyurtma** (`/buyurtma`, `/checkout`) — manzil, Click/Payme/Naqd (namuna), tasdiq `/buyurtma/tasdiq`
- **Forma** (`/forma`) — tibbiy forma katalogi: kategoriya, o‘lcham, rang, jins, brend, narx filtrlari. **Savatga** umumiy savatga o‘lcham/rang bilan qo‘shadi. Batafsil `/forma/[id]`. Embroidery so‘rovi. **Mening forma buyurtmalarim** `/forma/buyurtmalarim`. Checkout `/buyurtma` forma qatorlarini qabul qiladi.
- **Ishlar** (`/ishlar`) — filtrlar (lavozim, shahar, ish turi, maosh, tajriba) katalogni kesadi. **Ariza yuborish** (featured va kartalar): ism, telefon, ixtiyoriy Telegram, tajriba, qisqa xat — `yuborildi` holatida saqlanadi; bir xil telefon+vakansiya takrorlanmaydi. **Vakansiya joylash** katalogga «faol» e’lon qo‘shadi. **Rezyume yuklash** — «Mening rezyumem», Talabgorlarda ko‘rinadi. Batafsil `/ishlar/[id]`. **Mening arizalarim** `/ishlar/arizalarim` (Yuborildi / Ko‘rib chiqilmoqda / Qabul / Rad / Bekor).
- **Community** (`/community`) — Barchasi / Case / Savol / Yangilik tablari lentani kesadi. **Yangi post**: tur, matn (majburiy), ixtiyoriy rasm URL yoki namuna rasm, teglar — `localStorage`da saqlanadi va tepaga tushadi. Like, izoh va **Havola nusxalandi** (ulashish) saqlanadi. Case’da bemor ismi ogohlantiriladi. Trend mavzular va top doktorlar yangi post/teglar bilan yangilanadi. Batafsil `/community/[id]`.
- **Seminarlar** (`/seminarlar`) — yaqin tadbirlar (sana bo‘yicha), featured, kartochka/ro‘yxat. **Ro‘yxatdan o‘tish** `/seminarlar/[id]`: ism, telefon, ixtiyoriy Telegram/klinika. Yozuv `kutilmoqda` holatida saqlanadi; **Kelaman / Kelolmayman**. Joylar: tasdiqlangan + kutilmoqda band; bekor qilinsa qayta yozilish mumkin. **Mening yozuvlarim** (`/seminarlar/yozuvlarim`)
- **Ustalar** (`/ustalar`) — filtrlar (Rentgen, Kreslo, O‘rnatish, Ta’mirlash, shahar, reyting) katalogni kesadi. **Qo‘ng‘iroq** (`tel:`) va **Telegram** (`t.me`) ishlaydi; bosish `bog‘langan` jurnaliga yoziladi. **Bog‘lanish** — Call + Telegram + **Xizmat so‘rovi**. So‘rovlar `/ustalar/sorovlarim` (Yuborildi / Jarayonda / Bajarildi / Bekor).
- **Laboratoriya** (`/laboratoriya`) — filtrlar (xizmat, material, muddat, shahar, reyting) katalogni kesadi. **Bog‘lanish**: Qo‘ng‘iroq / Telegram / buyurtma. **Yangi buyurtma** (lab, xizmat, material, bemor kodi/initsial, muddat, telefon, izoh) `qabul_qilindi` holatida saqlanadi. Stepper: Qabul qilindi → Ishlanmoqda → Tayyor → Yetkazildi. **Mening lab buyurtmalarim** `/laboratoriya/buyurtmalarim`. **Lab qo‘shish** — hamkor arizasi kutilmoqda. Marketplace materiallari `/marketplace?cat=laboratoriya`.
- **Marketing** — logo/sayt/reklama/Instagram so‘rov formasi
- Qolgan menyu punktlari — “tez orada” yoki marketplace filtri (Jihozlar)

Barcha narx, tadbir va hamkor ma’lumotlari **demo**.

## Admin panel (`/admin`)

CEO paneli: dashboard (sof foyda, GMV, MRR, escrow), foydalanuvchilar (blok, rol), do‘konlar, sotuvchi arizalari, buyurtmalar & escrow (release/refund), reklama (banner → sayt), kanal auksioni, kontent moderatsiyasi, audit jurnali, CSV hisobot.

**Ishonch modeli**
- Brauzer Supabase’ga to‘g‘ridan-to‘g‘ri yozmaydi: barcha `sh_*` RPC’lar `STOMAHUB_DB_SECRET` bilan himoyalangan va faqat server route’lardan chaqiriladi; sessiya — imzolangan httpOnly cookie.
- Admin huquqi har so‘rovda SQL’da tekshiriladi (`assert_admin`, rollar: owner / admin / moderator / finance). Admin bo‘lmaganlarga `/admin` va `/api/admin/*` **404**.
- Owner (CEO) env orqali: `ADMIN_PHONES`, `ADMIN_EMAILS`, ixtiyoriy `ADMIN_TELEGRAM_IDS` (vergul bilan). Shu identifikator bilan kirgan akkaunt avtomatik owner bo‘ladi (`sh_session_ping`). Telefon 9 xonali milliy formatga normallashtiriladi.
- Barcha admin amallari `audit_log`da.
- Click/Payme hali ulanmagan: onlayn to‘lov tanlangan buyurtma demo sifatida darhol escrow’ga tushadi; naqd — sotuvchi «yetkazildi» qilganda.

## Ro‘yxatdan o‘tish lidlari

Telefon (`/royxat`) yoki Google orqali hisob ochilganda odam avtomatik `public.leads` ga yoziladi: ism, telefon, email, rol, usul (`phone` yoki `google`), tashrif UTMsi va vaqt. `/royxat` email emas, telefon + parol — shu sabab usul `email` emas, `phone`. Telegram orqali kirish lid yozmaydi. Bir foydalanuvchi — bitta qator; keyingi kirish yoki profil yangilanishi bo‘sh joylarni to‘ldiradi, birinchi UTMni ustiga yozmaydi.

Jadvalni bir marta qo‘llang (oldingi qoralama shu fayl bilan qo‘yilgan bo‘lsa ham, yangi SQL jadvalni qayta shakllantiradi):

```bash
# Supabase SQL editor yoki psql — bootstrapdan keyin
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/20261024a_homepage_leads.sql
```

Yozuvlar RLS bilan yopiq. Server `sh_lead_upsert` (`STOMAHUB_DB_SECRET`) yozadi, adminlar `/admin/lidlar` da `sh_admin_leads` orqali o‘qiydi. Anon jadvalni ko‘ra olmaydi. Lid jadvali yo‘q bo‘lsa ham kirish ishlayveradi.

Google telefon qaytarmaydi. Raqam yo‘q bo‘lsa, ilovaga kirishdan oldin `/royxat/telefon` da ism, telefon va rol so‘raladi. Google Cloud’da OAuth clientning Authorized JavaScript origins ro‘yxatida `https://stomatolog-kaliti-lake.vercel.app` (va sinayotgan preview origin) bo‘lishi kerak. Redirect URI shart emas. `NEXT_PUBLIC_GOOGLE_CLIENT_ID` shu clientga mos.

Aloqa telefoni, manzil va Instagram `src/config/public-contact.ts` da. Telefon `null` bo‘lsa, sahifada ko‘rinmaydi. Instagram URL bo‘sh bo‘lsa, footerda «Tez orada» turadi — havola o‘ylab topilmaydi.

## Analitika

Skriptlar faqat mos `NEXT_PUBLIC_*` o‘rnatilganda yuklanadi. Bo‘sh qoldirilsa, hech narsa ulanmaydi. Konversiya yangi lid qatori yaratilganda bir marta yuboriladi: birinchi telefon ro‘yxati, birinchi Google hisobi, yoki telefon qadami lidni shu yerda birinchi marta yozsa. Keyingi kirish va profil tahriri hodisani qayta yubormaydi.

| O‘zgaruvchi | Qayerdan | Hodisa |
| --- | --- | --- |
| `NEXT_PUBLIC_YANDEX_METRIKA_ID` | Yandex Metrika hisob raqami (faqat raqamlar) | `reachGoal` nomi: `lead`. Metrikada shu identifikatorli JavaScript maqsadini oching. |
| `NEXT_PUBLIC_META_PIXEL_ID` | Meta Events Manager pixel id (faqat raqamlar) | standart `Lead` |
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | GA4 o‘lchov id, `G-` bilan | tavsiya etilgan `generate_lead` |
| `NEXT_PUBLIC_CLARITY_PROJECT_ID` | Microsoft Clarity loyiha id | maxsus hodisa `lead` |

Ism va telefon analitika hodisasiga qo‘shilmaydi.

## Texnika

Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui. Kontent: `src/data/`. Shell: `src/components/dashboard/`.
