export const READER_PAGES = 320;

export type ReaderBlock =
  | { type: "h2"; text: string }
  | { type: "p"; text: string }
  | { type: "figure" }
  | { type: "factors"; items: { title: string; text: string }[] };

export type ReaderChapter = {
  id: string;
  label: string;
  summary: string;
  page: number;
  blocks: ReaderBlock[];
};

export const readerChapters: ReaderChapter[] = [
  {
    id: "kirish",
    label: "1-bob. Klinik ko‘rik",
    summary: "Bemor qabuli, anamnez va tashxis rejasi",
    page: 1,
    blocks: [
      { type: "h2", text: "1.1. Bemorni qabul qilish" },
      { type: "p", text: "Klinik qabul bemorning shikoyati, anamnezi va umumiy holatini aniqlashdan boshlanadi. Shifokor og‘riqning xarakteri, davomiyligi, qo‘zg‘atuvchi omillar va avval o‘tkazilgan davolashlar haqida so‘raydi." },
      { type: "p", text: "Og‘iz bo‘shlig‘i ko‘rigida tish qatorlari, milk, shilliq qavat va gigiyena darajasi baholanadi. Zarur bo‘lsa, rentgen yoki tashxis testlari qo‘shiladi." },
      { type: "h2", text: "1.2. Tashxis yozuvi" },
      { type: "p", text: "Tashxis aniq, qisqa va davolash rejasiga bog‘langan bo‘lishi kerak. Har bir tish uchun kariyes, pulpit yoki periodontit alohida qayd etiladi va bemorga tushunarli tilda tushuntiriladi." },
    ],
  },
  {
    id: "kariyes",
    label: "2-bob. Kariyes va uning davolash usullari",
    summary: "Kariyesning etiologiyasi, klinik ko‘rinishi va davolash usullari",
    page: 45,
    blocks: [
      { type: "h2", text: "2.1. Kariyes tushunchasi" },
      { type: "p", text: "Kariyes — bu tish qattiq to‘qimalarining mikroblar omillar ta‘sirida asta-sekin yemirilishi bilan kechadigan patologik jarayon bo‘lib, u emal, dentin va sementni zararlaydi. Kariyes jarayoni ko‘p omilli bo‘lib, unda mikroorganizmlar, uglevodlar, so‘lak va bemorning individual xususiyatlari muhim rol o‘ynaydi." },
      { type: "figure" },
      { type: "p", text: "Kariyes asosan Streptococcus mutans va Lactobacillus bakteriyalarining uglevodlarni fermentatsiya qilishi natijasida hosil bo‘ladigan kislotalar ta‘sirida tish to‘qimalarining demineralizatsiyasi bilan boshlanadi. Bu jarayon vaqt o‘tishi bilan chuqurlashib, kavitet hosil qiladi." },
      { type: "h2", text: "2.2. Kariyesning etiologiyasi" },
      { type: "p", text: "Kariyes rivojlanishida quyidagi asosiy omillar ishtirok etadi:" },
      {
        type: "factors",
        items: [
          { title: "Mikrobiologik omil", text: "Streptococcus mutans, Lactobacillus va boshqa kariyesogen mikroorganizmlar." },
          { title: "Uglevodlar", text: "Tez hazm bo‘ladigan shakarlar bakteriyalar uchun substrat bo‘lib, kislota hosil bo‘lishini kuchaytiradi." },
          { title: "So‘lak omili", text: "So‘lak miqdori, pH va bufer sig‘imi emalning remineralizatsiyasini belgilaydi." },
          { title: "Vaqt omili", text: "Kislota ta‘siri qancha uzoq davom etsa, demineralizatsiya shuncha chuqurlashadi." },
        ],
      },
    ],
  },
  {
    id: "pulpit",
    label: "3-bob. Pulpit va periodontit",
    summary: "Pulpaga tarqalgan yallig‘lanish va uning klinikasi",
    page: 128,
    blocks: [
      { type: "h2", text: "3.1. Pulpit belgilari" },
      { type: "p", text: "Pulpitda og‘riq o‘z-o‘zidan, kechasi kuchayadi va sovuq yoki issiq ta‘siridan keyin uzoq saqlanadi. Kavitet chuqur bo‘lib, dentin sezgirligi oshgan bo‘ladi." },
      { type: "p", text: "Davolashda pulpa holati baholanadi: qisman yoki to‘liq ekstirpatsiya, kanalni mexanik va kimyoviy qayta ishlash, so‘ng germetik obturatsiya qilinadi." },
      { type: "h2", text: "3.2. Apikal periodontit" },
      { type: "p", text: "Infeksiya ildiz uchi atrofiga o‘tganda perkussiya og‘riqli bo‘ladi, milk shishishi va fistula kuzatilishi mumkin. Rentgenda periapikal soyani baholash davolash hajmini aniqlaydi." },
    ],
  },
  {
    id: "profilaktika",
    label: "4-bob. Profilaktika",
    summary: "Gigiyena, ftor va kariyes xavfini kamaytirish",
    page: 210,
    blocks: [
      { type: "h2", text: "4.1. Individual gigiyena" },
      { type: "p", text: "Kuniga ikki marta ftorli pasta bilan cho‘tka qilish, tish ipi va tilni tozalash kariyes xavfini sezilarli kamaytiradi. Shakarli gazaklarning chastotasini cheklash kislota hujumlarini qisqartiradi." },
      { type: "h2", text: "4.2. Klinik profilaktika" },
      { type: "p", text: "Professional tozalash, ftorlak va tishlar orasidagi germetik yopish bolalar va yuqori xavfli bemorlarda birinchi tanlov hisoblanadi. Nazorat ko‘rigi olti oyda bir marta tavsiya etiladi." },
    ],
  },
];
