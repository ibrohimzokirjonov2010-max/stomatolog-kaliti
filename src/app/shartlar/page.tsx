import type { Metadata } from "next";
import Link from "next/link";
import { ContactBlock, LegalShell, OPERATOR, Section, Ul } from "@/components/legal/legal-shell";
import { MARKETPLACE_COMMISSION_PERCENT } from "@/lib/commission";
import { getSiteContact } from "@/lib/server/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Foydalanish shartlari",
  description: "StomaHub platformasidan foydalanish shartlari: vositachilik, escrow, komissiya, mas’uliyat va nizolar.",
};

const TOC = [
  { id: "umumiy", label: "Umumiy qoidalar" },
  { id: "vositachi", label: "Platforma — vositachi" },
  { id: "hisob", label: "Hisob va xavfsizlik" },
  { id: "marketplace", label: "Marketplace, escrow va komissiya" },
  { id: "sotuvchi", label: "Sotuvchi mas’uliyati" },
  { id: "tashkilotchi", label: "Seminar tashkilotchisi" },
  { id: "elonlar", label: "Usta, laboratoriya, ish va material" },
  { id: "nizo", label: "Nizolar" },
  { id: "taqiq", label: "Taqiqlangan kontent" },
  { id: "bloklash", label: "Hisobni bloklash" },
  { id: "javobgarlik", label: "Javobgarlikni cheklash" },
  { id: "qonun", label: "Amaldagi qonun" },
  { id: "ozgarish", label: "O‘zgarishlar va aloqa" },
];

export default async function ShartlarPage() {
  const contact = await getSiteContact();
  return (
    <LegalShell
      current="/shartlar"
      title="Foydalanish shartlari"
      toc={TOC}
      intro="Quyidagi shartlar StomaHub platformasidan foydalanish tartibini belgilaydi. Ro‘yxatdan o‘tish yoki platformadan foydalanishni davom ettirish orqali siz ushbu shartlarga va Maxfiylik siyosatiga rozilik bildirasiz."
    >
      <Section id="umumiy" n={1} title="Umumiy qoidalar">
        <p>
          Platforma egasi va operatori: <b>{OPERATOR}</b>. Platforma stomatologlar, klinikalar, sotuvchilar, seminar tashkilotchilari, ustalar,
          laboratoriyalar va ish qidiruvchilarni bog‘laydi. Platforma tibbiy maslahat bermaydi va davolash natijasi uchun javob bermaydi.
        </p>
      </Section>

      <Section id="vositachi" n={2} title="Platforma — vositachi">
        <p>
          Biz foydalanuvchilarni bir-biri bilan bog‘laydigan vositachimiz. Sotuvchi, tashkilotchi, usta, laboratoriya, ish beruvchi yoki e’lon egasi
          bilan tuziladigan bitim — ularning o‘rtasidagi bitim. Platforma tovar yoki xizmatning sifati, qonuniyligi va yetkazilishi uchun
          bevosita sotuvchi/ijrochi hisoblanmaydi, faqat quyida yozilgan vositachilik va escrow vazifalarini bajaradi.
        </p>
      </Section>

      <Section id="hisob" n={3} title="Hisob va xavfsizlik">
        <Ul>
          <li>Ro‘yxatdan o‘tishda to‘g‘ri ma’lumot kiriting; bitta shaxs uchun bitta hisob.</li>
          <li>Parol va kirish ma’lumotlarining maxfiyligi uchun o‘zingiz javobgarsiz; hisobingizdagi harakatlar sizniki hisoblanadi.</li>
          <li>Platformadan foydalanish uchun kamida 18 yosh to‘lgan bo‘lishingiz kerak.</li>
        </Ul>
      </Section>

      <Section id="marketplace" n={4} title="Marketplace, escrow va komissiya">
        <Ul>
          <li>
            <b>Escrow:</b> buyurtma uchun to‘langan mablag‘ platforma himoyasida ushlab turiladi va sotuvchiga darhol berilmaydi. Xaridor buyurtmani
            olganini tasdiqlagach mablag‘ sotuvchiga o‘tkaziladi. Buyurtma bekor qilinsa, qaytarilsa yoki nizo xaridor foydasiga hal bo‘lsa, mablag‘
            xaridorga qaytariladi.
          </li>
          <li>
            <b>Komissiya:</b> Marketplace’dagi sotuvchilardan sotuvdan o‘tkaziladigan summaning <b>{MARKETPLACE_COMMISSION_PERCENT}%</b> miqdorida
            komissiya olinadi; u sotuvchiga to‘lanadigan mablag‘dan ushlab qolinadi va buyurtma bo‘yicha ko‘rsatiladi. Agar boshqa bo‘lim uchun
            komissiya yoki to‘lov joriy etilsa, u oldindan shu bo‘limda ko‘rsatiladi.
          </li>
          <li>
            <b>Bonuslar</b> faqat Marketplace’da ishlatiladi, naqd pulga almashtirilmaydi va qoidabuzarlik aniqlansa bekor qilinishi mumkin.
          </li>
          <li>Narx, mavjudlik va yetkazib berish shartlari mahsulot sahifasida sotuvchi tomonidan ko‘rsatiladi.</li>
        </Ul>
      </Section>

      <Section id="sotuvchi" n={5} title="Sotuvchi mas’uliyati">
        <Ul>
          <li>Sotuvchi arizasi administrator tomonidan ko‘rib chiqiladi; platforma arizani rad etish yoki do‘konni to‘xtatish huquqini saqlab qoladi.</li>
          <li>Sotuvchi mahsulot haqida to‘g‘ri ma’lumot, original va amal qilish muddati o‘tmagan tovar, o‘z vaqtida jo‘natish va kafolat uchun javobgar.</li>
          <li>Qonunan ruxsat berilmagan, soxta, muddati o‘tgan yoki retsept talab qiladigan tovarlarni sotish taqiqlanadi.</li>
          <li>Soliq va boshqa qonuniy majburiyatlarni bajarish sotuvchining zimmasida.</li>
        </Ul>
      </Section>

      <Section id="tashkilotchi" n={6} title="Seminar tashkilotchisi">
        <p>
          Tashkilotchi seminar mazmuni, sanasi, joyi, narxi va o‘tkazilishi uchun to‘liq javobgar. Seminar bekor qilinsa yoki o‘zgarsa, ishtirokchilarni
          o‘z vaqtida xabardor qilishi va kelishilgan shartlar bo‘yicha qaytarish qilishi shart. Tashkilotchi arizasi administrator tomonidan tasdiqlanadi.
        </p>
      </Section>

      <Section id="elonlar" n={7} title="Usta, laboratoriya, ish va ortiqcha material e’lonlari">
        <Ul>
          <li>
            E’lonlar (usta, laboratoriya, vakansiya, ortiqcha material) joylanishidan oldin administrator tomonidan tekshiriladi; tasdiqlanganlar
            ommaviy ko‘rinadi. Platforma e’lonni rad etish, yashirish yoki o‘chirish huquqiga ega.
          </li>
          <li>
            E’lon egasi (usta, laboratoriya, ish beruvchi, sotuvchi) e’lon haqiqiyligi, xizmat/tovar sifati, narx va kelishuv shartlari uchun
            o‘zi javob beradi. Ishga olish, xizmat buyurtmasi va ortiqcha materialni oldi-sotdi bitimlari foydalanuvchilar o‘rtasida tuziladi.
          </li>
          <li>
            Ortiqcha material e’lonida mahsulot holati (yopiq/ochilgan), yaroqlilik muddati va narx to‘g‘ri ko‘rsatilishi shart; yaroqlilik muddati
            o‘tgan yoki sifatsiz tovarni sotish taqiqlanadi.
          </li>
          <li>
            Telefon raqamlar ommaviy ko‘rsatilmaydi — bog‘lanish so‘rovi yuborilgach, e’lon egasi qabul qilsa ochiladi. O‘ziga so‘rov yuborish va
            spam taqiqlanadi.
          </li>
        </Ul>
      </Section>

      <Section id="nizo" n={8} title="Nizolar">
        <p>
          Buyurtma bo‘yicha nizo bo‘lsa, avval sotuvchi bilan kelishishga harakat qiling. Kelishilmasa, platformada nizo oching — administrator
          ikkala tomonning dalillarini ko‘rib chiqib, escrow mablag‘ini qaytarish yoki sotuvchiga o‘tkazish haqida qaror qabul qiladi. Platforma qarori
          sudga murojaat qilish huquqingizni cheklamaydi. Foydalanuvchilar o‘rtasidagi boshqa nizolar tomonlarning o‘zi tomonidan, kelishilmasa
          qonunda belgilangan tartibda hal qilinadi.
        </p>
      </Section>

      <Section id="taqiq" n={9} title="Taqiqlangan kontent va harakatlar">
        <Ul>
          <li>qonunga zid, firibgarlik, aldov, soxta yoki chalg‘ituvchi ma’lumot;</li>
          <li>kontrafakt, muddati o‘tgan, ruxsatsiz dori vositalari va tibbiy mahsulotlar;</li>
          <li>haqorat, kamsitish, tahdid, boshqa shaxsning shaxsiy ma’lumotini ruxsatsiz tarqatish;</li>
          <li>spam, ommaviy xabar, takroriy e’lonlar, platforma ishiga xalaqit beruvchi yoki xavfsizlikni buzuvchi harakatlar;</li>
          <li>boshqa shaxs nomidan chiqish yoki soxta hisob ochish;</li>
          <li>platformani chetlab o‘tib escrow himoyasidan qochish maqsadida yolg‘on bitimlar tuzish.</li>
        </Ul>
      </Section>

      <Section id="bloklash" n={10} title="Hisobni cheklash va bloklash">
        <p>
          Shartlar buzilsa, platforma ogohlantirish berishi, e’lonlarni yashirishi, hisobni vaqtincha cheklashi yoki bloklashi mumkin. Bloklangan
          hisob egasi sabab haqida xabardor qilinadi va murojaat qilish huquqiga ega. Siz hisobingizni istalgan vaqtda{" "}
          <Link className="font-semibold text-[#0F766E] hover:underline" href="/hisobni-ochirish">
            o‘chirish so‘rovi
          </Link>{" "}
          orqali yopishingiz mumkin; tugallanmagan buyurtma yoki nizo bo‘lsa, ular avval yakunlanadi.
        </p>
      </Section>

      <Section id="javobgarlik" n={11} title="Javobgarlikni cheklash">
        <p>
          Platforma “mavjud holatda” taqdim etiladi. Qonun ruxsat bergan darajada platforma: foydalanuvchilar joylagan ma’lumot va e’lonlarning
          to‘g‘riligi, uchinchi shaxslarning (sotuvchi, ustalar, laboratoriya, ish beruvchi, yetkazib berish) harakatlari, texnik nosozlik yoki
          uzilishlar tufayli ko‘rilgan bilvosita zarar va yo‘qotilgan foyda uchun javobgar emas. Bevosita zarar uchun javobgarlik platforma orqali
          o‘tgan tegishli buyurtma summasidan oshmaydi. Qonun bilan chetlab bo‘lmaydigan javobgarlik bu shartlar bilan cheklanmaydi.
        </p>
      </Section>

      <Section id="qonun" n={12} title="Amaldagi qonun">
        <p>
          Ushbu shartlarga O‘zbekiston Respublikasi qonunchiligi qo‘llaniladi. Kelishuv yo‘li bilan hal bo‘lmagan nizolar O‘zbekiston Respublikasining
          vakolatli sudida ko‘rib chiqiladi.
        </p>
      </Section>

      <Section id="ozgarish" n={13} title="O‘zgarishlar va aloqa">
        <p>
          Shartlar yangilanishi mumkin; yangi tahrir shu sahifada e’lon qilinadi va “Oxirgi yangilanish” sanasi o‘zgaradi. Yangilangandan keyin
          platformadan foydalanishni davom ettirish yangi shartlarga rozilikni bildiradi. Shaxsiy ma’lumotlar haqida batafsil:{" "}
          <Link className="font-semibold text-[#0F766E] hover:underline" href="/maxfiylik">
            Maxfiylik siyosati
          </Link>
          .
        </p>
        <ContactBlock contact={contact} scope="savol" />
      </Section>
    </LegalShell>
  );
}
