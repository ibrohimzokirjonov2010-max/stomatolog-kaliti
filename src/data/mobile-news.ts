export type NewsKind = "texnologiya" | "seminarlar" | "klinikalar" | "tadqiqotlar";

export type MobileNews = {
  id: string;
  title: string;
  excerpt: string;
  body: string;
  date: string;
  minutes: number;
  views: number;
  kind: NewsKind;
  image: string;
  featured?: boolean;
  rank: number;
};

export const newsKinds: { id: "all" | NewsKind; label: string }[] = [
  { id: "all", label: "Barchasi" },
  { id: "texnologiya", label: "Texnologiya" },
  { id: "seminarlar", label: "Seminarlar" },
  { id: "klinikalar", label: "Klinikalar" },
  { id: "tadqiqotlar", label: "Tadqiqotlar" },
];

export const mobileNews: MobileNews[] = [
  {
    id: "implant-texnologiya",
    title: "Implantatsiya sohasidagi yangi texnologiya",
    excerpt: "Yangi avlod implantlari endi O‘zbekistonda!",
    body: "Yangi avlod implantlari endi O‘zbekistonda. Raqamli rejalashtirish va yangi yuzalik tufayli o‘rnatish aniqroq, tiklanish esa qisqaroq bo‘ladi. Klinikalar birinchi bemorlarni qabul qilishni boshladi.",
    date: "12.10.2025",
    minutes: 5,
    views: 12500,
    kind: "texnologiya",
    image: "/img/mobile/yn-implant.jpg",
    featured: true,
    rank: 1,
  },
  {
    id: "mikroskop",
    title: "Stomatologik mikroskop: aniqlik va sifat kafolati",
    excerpt: "Zamonaviy stomatologiyada mikroskop qo‘llashning afzalliklari haqida...",
    body: "Zamonaviy stomatologiyada mikroskop qo‘llash kanal og‘zini, yoriqlarni va mayda nuqsonlarni aniq ko‘rsatadi. Bu davolash sifatini oshiradi va qayta ishlovni kamaytiradi.",
    date: "10.10.2025",
    minutes: 3,
    views: 8700,
    kind: "texnologiya",
    image: "/img/mobile/yn-scope.jpg",
    rank: 2,
  },
  {
    id: "profilaktika",
    title: "Davolashdan oldin to‘g‘ri profilaktika muhim",
    excerpt: "Tish salomatligini saqlashda profilaktika chora-tadbirlari haqida...",
    body: "Tish salomatligini saqlashda profilaktika chora-tadbirlari birinchi o‘rinda turadi. Muntazam ko‘rik, to‘g‘ri tozalash va professional gigiyena davolashga bo‘lgan ehtiyojni sezilarli kamaytiradi.",
    date: "08.10.2025",
    minutes: 4,
    views: 7100,
    kind: "klinikalar",
    image: "/img/mobile/yn-tools.jpg",
    rank: 3,
  },
  {
    id: "oq-tishlar",
    title: "Oq tishlar – ishonch belgisi",
    excerpt: "Professional oqartirish usullari va ularning afzalliklari...",
    body: "Professional oqartirish usullari emalni himoya qilgan holda tabiiy oq tus beradi. Shifokor soyani tish tuzilishiga qarab tanlaydi va natija qancha saqlanishini tushuntiradi.",
    date: "06.10.2025",
    minutes: 6,
    views: 11300,
    kind: "tadqiqotlar",
    image: "/img/mobile/yn-smile.jpg",
    rank: 4,
  },
  {
    id: "rentgen",
    title: "Rentgen tekshiruvi: aniq tashxis kaliti",
    excerpt: "Panoramik rentgenning imkoniyatlari va qo‘llanilishi...",
    body: "Panoramik rentgen yashirin kariyes, ildiz va suyak holatini bir kadrda ko‘rsatadi. Aniq tashxis davolash rejasini to‘g‘ri tuzishga yordam beradi.",
    date: "04.10.2025",
    minutes: 4,
    views: 6400,
    kind: "tadqiqotlar",
    image: "/img/mobile/yn-xray.jpg",
    rank: 5,
  },
  {
    id: "xalqaro-seminar",
    title: "Implantologiya bo‘yicha xalqaro seminar",
    excerpt: "Toshkentda xalqaro spikerlar ishtirokida amaliy seminar bo‘lib o‘tadi...",
    body: "Toshkentda xalqaro spikerlar ishtirokida amaliy seminar bo‘lib o‘tadi. Dasturda yangi implant protokollari va jonli namoyish bor.",
    date: "02.10.2025",
    minutes: 4,
    views: 5400,
    kind: "seminarlar",
    image: "/img/news/expo.jpg",
    rank: 6,
  },
];

export function getMobileNews(id: string) {
  return mobileNews.find((item) => item.id === id) ?? null;
}

export function formatNewsViews(views: number) {
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
  return String(views);
}
