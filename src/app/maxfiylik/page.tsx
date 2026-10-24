import type { Metadata } from "next";
import Link from "next/link";
import { ContactBlock, LegalShell, OPERATOR, Section, Ul } from "@/components/legal/legal-shell";
import { getSiteContact } from "@/lib/server/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Maxfiylik siyosati",
  description: "StomaHub platformasi qanday ma’lumot yig‘adi, nima uchun ishlatadi va foydalanuvchi huquqlari.",
};

const TOC = [
  { id: "umumiy", label: "Umumiy ma’lumot" },
  { id: "yigiladi", label: "Qanday ma’lumot yig‘iladi" },
  { id: "google", label: "Google hisobi ma’lumotlari" },
  { id: "maqsad", label: "Nima uchun ishlatiladi" },
  { id: "ulashish", label: "Kim bilan ulashiladi" },
  { id: "muddat", label: "Saqlash muddati" },
  { id: "xavfsizlik", label: "Xavfsizlik" },
  { id: "huquqlar", label: "Sizning huquqlaringiz" },
  { id: "cookie", label: "Cookie va brauzer xotirasi" },
  { id: "bolalar", label: "Bolalar" },
  { id: "ozgarish", label: "O‘zgarishlar" },
  { id: "aloqa", label: "Bog‘lanish" },
];

export default async function MaxfiylikPage() {
  const contact = await getSiteContact();
  return (
    <LegalShell
      current="/maxfiylik"
      title="Maxfiylik siyosati"
      toc={TOC}
      intro="Bu hujjat StomaHub platformasi (stomatologlar uchun marketplace, seminarlar, ustalar, laboratoriya, ishlar va boshqa bo‘limlar) sizning shaxsiy ma’lumotlaringizni qanday yig‘ishi, ishlatishi va himoya qilishini tushuntiradi. Platformadan foydalanish orqali siz ushbu siyosat bilan tanishganingizni tasdiqlaysiz."
    >
      <Section id="umumiy" n={1} title="Umumiy ma’lumot">
        <p>
          Platforma egasi va shaxsiy ma’lumotlar operatori: <b>{OPERATOR}</b>. Platforma manzili:{" "}
          <span className="break-all">stomatolog-kaliti-lake.vercel.app</span>. Ushbu siyosat O‘zbekiston Respublikasining shaxsiy ma’lumotlar to‘g‘risidagi
          qonunchiligiga muvofiq yozilgan.
        </p>
      </Section>

      <Section id="yigiladi" n={2} title="Qanday ma’lumot yig‘iladi">
        <p>Biz faqat platforma ishlashi uchun kerak bo‘lgan ma’lumotlarni yig‘amiz:</p>
        <Ul>
          <li>
            <b>Hisob ma’lumotlari:</b> ism-familiya, telefon raqami, email (agar kiritilgan yoki Google orqali olingan bo‘lsa), parol (faqat xesh —
            qaytarib bo‘lmaydigan ko‘rinishda), shahar, mutaxassislik, klinika nomi, o‘zingiz haqingizdagi qisqa matn, profil rasmi.
          </li>
          <li>
            <b>Google profili:</b> “Google orqali davom etish” tugmasi bosilganda Google bergan ism, tasdiqlangan email manzil, profil rasmi va Google
            hisobingizning noyob identifikatori (batafsil — 3-bo‘lim).
          </li>
          <li>
            <b>Telegram:</b> Telegram orqali kirganda yoki bildirishnomalarni ulaganda Telegram username va chat identifikatori (chat id).
          </li>
          <li>
            <b>Buyurtma va to‘lov tarixi:</b> buyurtma tarkibi, summa, holat, yetkazib berish manzili, qabul qiluvchi ismi va telefoni, to‘lov usuli va
            holati (escrow), bonuslar. To‘liq bank karta raqami va CVV kodi platforma bazasida saqlanmaydi.
          </li>
          <li>
            <b>Siz joylagan kontent:</b> e’lonlar (usta, laboratoriya, vakansiya, rezyume, ortiqcha material), seminarga yozilish, community postlari va
            izohlari, sotuvchi/tashkilotchi arizalari, yuklangan rasmlar.
          </li>
          <li>
            <b>Klinika ma’lumotlari:</b> “Mening klinikam” bo‘limida siz kiritgan bemorlar, qabullar va xodimlar ro‘yxati. Bu ma’lumotlar faqat sizga
            ko‘rinadi; ularning qonuniy asosi va bemorlarning roziligi uchun klinika egasi — siz — javobgarsiz.
          </li>
          <li>
            <b>Bildirishnomalar va aloqa:</b> ilova ichidagi va Telegram orqali yuborilgan bildirishnomalar, siz yuborgan so‘rovlar (bog‘lanish,
            ariza, taklif, hisobni o‘chirish).
          </li>
          <li>
            <b>Texnik ma’lumotlar:</b> kirish sessiyasi, oxirgi faollik vaqti, firibgarlik va spamdan himoya uchun qurilma/tarmoq belgisining xeshi.
          </li>
        </Ul>
      </Section>

      <Section id="google" n={3} title="Google hisobi ma’lumotlari">
        <p>
          Agar siz Google orqali kirsangiz, biz Google’dan faqat quyidagilarni olamiz: <b>ism</b>, <b>tasdiqlangan email manzil</b>, <b>profil rasmi</b> va
          Google hisobingizning noyob identifikatori. Biz sizning Gmail xatlaringiz, kontaktlaringiz, Google Drive yoki boshqa Google ma’lumotlaringizga
          kirmaymiz.
        </p>
        <Ul>
          <li>Bu ma’lumotlar faqat hisob ochish, tizimga kirishni tasdiqlash va profilingizni ko‘rsatish uchun ishlatiladi.</li>
          <li>Ular sotilmaydi, reklama maqsadida ishlatilmaydi va uchinchi tomonlarga reklama/ma’lumot brokerlik uchun berilmaydi.</li>
          <li>
            Platformaning Google API’dan olingan ma’lumotlarni ishlatishi va boshqa ilovaga uzatishi{" "}
            <a className="font-semibold text-[#0F766E] hover:underline" href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer">
              Google API Services User Data Policy
            </a>
            ga, jumladan uning “Limited Use” (cheklangan foydalanish) talablariga muvofiq.
          </li>
          <li>
            Google hisobingizdan platformaga berilgan ruxsatni istalgan vaqtda{" "}
            <a className="font-semibold text-[#0F766E] hover:underline" href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer">
              myaccount.google.com/permissions
            </a>{" "}
            sahifasida bekor qilishingiz mumkin. Platformadagi ma’lumotlarni o‘chirish uchun{" "}
            <Link className="font-semibold text-[#0F766E] hover:underline" href="/hisobni-ochirish">
              so‘rov yuboring
            </Link>
            .
          </li>
        </Ul>
      </Section>

      <Section id="maqsad" n={4} title="Nima uchun ishlatiladi">
        <Ul>
          <li>Hisob ochish, kirish va shaxsingizni tasdiqlash;</li>
          <li>buyurtmalarni qabul qilish, to‘lovni escrow orqali himoyalash, yetkazib berish va nizolarni hal qilish;</li>
          <li>seminarga yozilish, usta/laboratoriya buyurtmalari, vakansiyaga ariza va ortiqcha material bo‘yicha bog‘lanishni tashkil qilish;</li>
          <li>muhim voqealar haqida bildirishnoma yuborish (ilova ichida va ulangan bo‘lsa Telegram orqali);</li>
          <li>e’lonlarni moderatsiya qilish, spam, firibgarlik va qoidabuzarlikning oldini olish;</li>
          <li>platformani yaxshilash va qonuniy talablarni bajarish.</li>
        </Ul>
      </Section>

      <Section id="ulashish" n={5} title="Kim bilan ulashiladi">
        <p>Shaxsiy ma’lumotlaringizni sotmaymiz. Ular faqat quyidagi hollarda va faqat zarur hajmda beriladi:</p>
        <Ul>
          <li>
            <b>Sotuvchi:</b> buyurtma bergan paytingizda — yetkazib berish uchun qabul qiluvchi ismi, telefoni, manzili va buyurtma tarkibi.
          </li>
          <li>
            <b>Seminar tashkilotchisi:</b> yozilganingizda — ism, telefon va ro‘yxatdan o‘tish ma’lumotlari.
          </li>
          <li>
            <b>Usta, laboratoriya, ish beruvchi, e’lon egasi:</b> telefon raqamlar ommaviy ko‘rsatilmaydi. Faqat siz bog‘lanish so‘rovi yuborganingizda
            (ism, telefon, xabar) e’lon egasiga ko‘rinadi; egasi so‘rovni qabul qilgandan keyingina uning telefoni sizga ochiladi.
          </li>
          <li>
            <b>Xizmat ko‘rsatuvchilar:</b> ma’lumotlar bazasi va hosting (Supabase, Vercel), Google (kirish), Telegram (bildirishnoma va tasdiqlash kodi),
            yetkazib berish xizmati. Ular ma’lumotni faqat bizning nomimizdan xizmat ko‘rsatish uchun qayta ishlaydi. Ba’zi serverlar O‘zbekiston
            tashqarisida joylashgan bo‘lishi mumkin.
          </li>
          <li>
            <b>Davlat organlari:</b> faqat qonun talab qilgan hollarda.
          </li>
        </Ul>
        <p>Profilingizdagi ism, mutaxassislik, shahar va rasm kabi ma’lumotlar, siz e’lon qilgan kontent boshqa foydalanuvchilarga ko‘rinishi mumkin.</p>
      </Section>

      <Section id="muddat" n={6} title="Saqlash muddati">
        <Ul>
          <li>Hisob ma’lumotlari — hisobingiz faol bo‘lgan davrda.</li>
          <li>Hisobni yoki ma’lumotni o‘chirish so‘rovi tasdiqlangach, profil, e’lon, rezyume, klinika va bildirishnoma ma’lumotlari o‘chiriladi.</li>
          <li>
            Buyurtma, to‘lov va nizo yozuvlari soliq, buxgalteriya va nizolarni hal qilish uchun qonun talab qilgan muddatgacha saqlanishi mumkin.
          </li>
          <li>Xavfsizlik jurnallari firibgarlikning oldini olish uchun cheklangan muddat saqlanadi.</li>
        </Ul>
      </Section>

      <Section id="xavfsizlik" n={7} title="Xavfsizlik">
        <p>
          Parollar xesh ko‘rinishida saqlanadi; ma’lumotlar bazasida qatorli kirish nazorati (RLS) yoqilgan — shaxsiy ma’lumot faqat egasiga
          ko‘rinadi; sessiya cookie’si faqat serverga mo‘ljallangan (httpOnly). Shunga qaramay, internet orqali uzatishning to‘liq xavfsizligini
          kafolatlab bo‘lmaydi. Parolingizni boshqalarga bermang.
        </p>
      </Section>

      <Section id="huquqlar" n={8} title="Sizning huquqlaringiz">
        <Ul>
          <li>ma’lumotlaringizni ko‘rish va nusxasini so‘rash;</li>
          <li>noto‘g‘ri ma’lumotni tuzatish (profil sahifasida o‘zingiz tahrirlaysiz yoki so‘rov yuborasiz);</li>
          <li>hisobingiz va ma’lumotlaringizni o‘chirishni talab qilish;</li>
          <li>qayta ishlashga roziligingizni qaytarib olish;</li>
          <li>e’lonlaringizni yopish yoki o‘chirish — istalgan vaqtda ilova ichida.</li>
        </Ul>
        <p>
          So‘rov yuborish:{" "}
          <Link className="font-semibold text-[#0F766E] hover:underline" href="/hisobni-ochirish">
            /hisobni-ochirish
          </Link>
          . Administrator so‘rovni ko‘rib chiqadi, kerak bo‘lsa shaxsingizni tasdiqlashni so‘raydi va natijani bildirishnoma orqali xabar qiladi.
        </p>
      </Section>

      <Section id="cookie" n={9} title="Cookie va brauzer xotirasi">
        <Ul>
          <li>
            <b>Zarur cookie:</b> kirish sessiyasi (<code>sh_session</code>) va xavfsizlik belgisi — ularsiz tizimga kirish ishlamaydi.
          </li>
          <li>
            <b>Brauzer xotirasi (localStorage):</b> savat, sevimlilar va interfeys sozlamalari kabi qulayliklar uchun qurilmangizda saqlanadi.
          </li>
          <li>Biz reklama yoki kuzatuv cookie’laridan foydalanmaymiz. Google va Telegram kirish tugmalari o‘zining cookie’larini qo‘yishi mumkin.</li>
        </Ul>
      </Section>

      <Section id="bolalar" n={10} title="Bolalar">
        <p>
          Platforma stomatologlar, klinikalar va tibbiyot sohasi mutaxassislari uchun mo‘ljallangan va 18 yoshga to‘lmaganlarga qaratilmagan. Biz
          18 yoshdan kichik shaxslardan ongli ravishda ma’lumot yig‘maymiz. Agar bunday ma’lumot yig‘ilganini bilsangiz, bizga xabar bering — o‘chiramiz.
        </p>
      </Section>

      <Section id="ozgarish" n={11} title="O‘zgarishlar">
        <p>
          Siyosatni yangilashimiz mumkin. Yangi tahrir shu sahifada e’lon qilinadi va yuqoridagi “Oxirgi yangilanish” sanasi o‘zgaradi. Muhim
          o‘zgarishlar haqida ilova ichida xabar beramiz.
        </p>
      </Section>

      <Section id="aloqa" n={12} title="Bog‘lanish">
        <p>Maxfiylik bo‘yicha savol, tuzatish yoki o‘chirish so‘rovi uchun:</p>
        <ContactBlock contact={contact} scope="savol" />
      </Section>
    </LegalShell>
  );
}
