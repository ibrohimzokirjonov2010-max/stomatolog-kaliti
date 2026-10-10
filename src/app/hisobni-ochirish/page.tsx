import type { Metadata } from "next";
import Link from "next/link";
import { ContactBlock, LegalShell, Section, Ul } from "@/components/legal/legal-shell";
import { PrivacyRequestForm } from "@/components/legal/privacy-request-form";
import { getSiteContact } from "@/lib/server/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Hisobni va ma’lumotni o‘chirish",
  description: "StomaHub hisobingizni yoki shaxsiy ma’lumotlaringizni o‘chirish so‘rovi.",
};

const TOC = [
  { id: "qanday", label: "Qanday ishlaydi" },
  { id: "ochiriladi", label: "Nima o‘chiriladi" },
  { id: "forma", label: "So‘rov yuborish" },
  { id: "google", label: "Google ruxsatini bekor qilish" },
];

export default async function HisobniOchirishPage({ searchParams }: { searchParams: Promise<{ turi?: string }> }) {
  const { turi } = await searchParams;
  const contact = await getSiteContact();
  return (
    <LegalShell
      current="/hisobni-ochirish"
      title="Hisobni va ma’lumotni o‘chirish"
      toc={TOC}
      intro="Hisobingizni, shaxsiy ma’lumotlaringiz nusxasini yoki ayrim ma’lumotni o‘chirishni xohlasangiz, quyidagi so‘rovni yuboring. Kirgan bo‘lsangiz, so‘rov hisobingizga bog‘lanadi."
    >
      <Section id="qanday" n={1} title="Qanday ishlaydi">
        <ol className="list-decimal space-y-1.5 pl-5 marker:font-bold marker:text-[#0066FF]">
          <li>Quyidagi formani to‘ldirib so‘rov yuboring (kirish shart emas, lekin kirsangiz tezroq tasdiqlanadi).</li>
          <li>Administrator so‘rovni ko‘radi va kerak bo‘lsa shaxsingizni tasdiqlash uchun siz bilan bog‘lanadi.</li>
          <li>Tugallanmagan buyurtma yoki nizo bo‘lsa, avval ular yakunlanadi.</li>
          <li>So‘rov bajarilgach yoki rad etilgach, kirgan foydalanuvchiga bildirishnoma yuboriladi.</li>
        </ol>
      </Section>

      <Section id="ochiriladi" n={2} title="Nima o‘chiriladi va nima saqlanishi mumkin">
        <Ul>
          <li>
            <b>O‘chiriladi:</b> profil (ism, telefon, email, rasm, bio), Google/Telegram bog‘lanishi, e’lonlar, rezyume, klinika bemorlari/xodimlari,
            bildirishnomalar.
          </li>
          <li>
            <b>Qonun talabi bilan saqlanishi mumkin:</b> buyurtma, to‘lov va nizo yozuvlari (soliq va buxgalteriya hamda ikkinchi tomon huquqlarini
            himoya qilish uchun) hamda xavfsizlik jurnallari — qonun talab qilgan muddatgacha.
          </li>
        </Ul>
        <p>
          Batafsil:{" "}
          <Link className="font-semibold text-[#0066FF] hover:underline" href="/maxfiylik">
            Maxfiylik siyosati
          </Link>
          .
        </p>
      </Section>

      <Section id="forma" n={3} title="So‘rov yuborish">
        <PrivacyRequestForm initialScope={turi} />
        <ContactBlock contact={contact} scope="hisob" />
      </Section>

      <Section id="google" n={4} title="Google ruxsatini bekor qilish">
        <p>
          Google orqali kirgan bo‘lsangiz, platformaga berilgan ruxsatni{" "}
          <a className="font-semibold text-[#0066FF] hover:underline" href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer">
            myaccount.google.com/permissions
          </a>{" "}
          sahifasida bekor qilishingiz mumkin. Bu platformadagi hisobni o‘zi o‘chirmaydi — hisobni o‘chirish uchun yuqoridagi so‘rovni yuboring.
        </p>
      </Section>
    </LegalShell>
  );
}
