export type JobSpec = "terapevt" | "ortoped" | "ortodont" | "jarroh" | "bolalar" | "gigiyenist" | "texnik" | "assistent" | "admin";
export type JobType = "toliq" | "yarim" | "smena" | "masofa";
export type JobExp = "yoq" | "y1" | "y3" | "y5";

export type DesktopJob = {
  id: string;
  title: string;
  clinic: string;
  city: string;
  district: string;
  spec: JobSpec;
  type: JobType;
  exp: JobExp;
  salaryMin: number;
  salaryMax: number;
  posted: string;
  fresh: number;
  blurb: string;
  image: string;
  verified: boolean;
};

export const jobCities = [
  { id: "Toshkent", label: "Toshkent" },
  { id: "Samarqand", label: "Samarqand" },
  { id: "Buxoro", label: "Buxoro" },
  { id: "Andijon", label: "Andijon" },
  { id: "Farg‘ona", label: "Farg‘ona" },
  { id: "Namangan", label: "Namangan" },
  { id: "Boshqa", label: "Boshqa" },
];

export const jobSpecs: { id: JobSpec; label: string }[] = [
  { id: "terapevt", label: "Terapevt" },
  { id: "ortoped", label: "Ortoped" },
  { id: "ortodont", label: "Ortodont" },
  { id: "jarroh", label: "Jarroh" },
  { id: "bolalar", label: "Bolalar stomatologi" },
  { id: "gigiyenist", label: "Gigiyenist" },
  { id: "texnik", label: "Tish texnigi" },
  { id: "assistent", label: "Assistent" },
  { id: "admin", label: "Administrator" },
];

export const jobTypes: { id: JobType; label: string }[] = [
  { id: "toliq", label: "To‘liq stavka" },
  { id: "yarim", label: "Yarim stavka" },
  { id: "smena", label: "Smenali" },
  { id: "masofa", label: "Masofaviy" },
];

export const jobExps: { id: JobExp; label: string }[] = [
  { id: "yoq", label: "Tajriba talab qilinmaydi" },
  { id: "y1", label: "1–3 yil" },
  { id: "y3", label: "3–5 yil" },
  { id: "y5", label: "5+ yil" },
];

export const SALARY_MIN = 3_000_000;
export const SALARY_MAX = 30_000_000;

export const specLabel = (id: JobSpec) => jobSpecs.find((item) => item.id === id)?.label ?? id;
export const typeLabel = (id: JobType) => jobTypes.find((item) => item.id === id)?.label ?? id;
export const expLabel = (id: JobExp) => jobExps.find((item) => item.id === id)?.label ?? id;
/** Short tag used on vacancy cards. The filter list keeps the longer labels. */
export function expTag(id: JobExp) {
  if (id === "y3") return "3+ yil";
  if (id === "y5") return "5+ yil";
  return expLabel(id);
}

const photos = ["/img/jobs/c1.jpg", "/img/jobs/c2.jpg", "/img/jobs/c3.jpg", "/img/jobs/c4.jpg", "/img/jobs/c5.jpg", "/img/jobs/c6.jpg", "/img/jobs/c7.jpg"];

const featured: DesktopJob[] = [
  { id: "ortoped-smile", title: "Ortoped stomatolog", clinic: "Smile Dental Clinic", city: "Toshkent", district: "Yunusobod", spec: "ortoped", type: "toliq", exp: "y3", salaryMin: 12_000_000, salaryMax: 18_000_000, posted: "2 kun oldin", fresh: 100, blurb: "Zamonaviy klinikada ortoped stomatolog kerak. Implant va protetik yo‘nalishda tajribali shifokor.", image: photos[0], verified: true },
  { id: "terapevt-dentacare", title: "Terapevt stomatolog", clinic: "DentaCare", city: "Toshkent", district: "Chilonzor", spec: "terapevt", type: "toliq", exp: "y1", salaryMin: 8_000_000, salaryMax: 12_000_000, posted: "1 kun oldin", fresh: 99, blurb: "Klinikamizga terapevt stomatolog kerak. Zamonaviy jihozlar va to‘liq bemorlar oqimi.", image: photos[1], verified: true },
  { id: "bolalar-family", title: "Bolalar stomatologi", clinic: "Family Dental", city: "Toshkent", district: "Mirzo Ulug‘bek", spec: "bolalar", type: "toliq", exp: "y3", salaryMin: 10_000_000, salaryMax: 15_000_000, posted: "3 kun oldin", fresh: 98, blurb: "Bolalar bilan ishlashni yaxshi ko‘radigan, mehribon va mas’uliyatli shifokor qidiramiz.", image: photos[2], verified: true },
  { id: "jarroh-implant", title: "Jarroh-implantolog", clinic: "Implant Plus", city: "Toshkent", district: "Shayxontohur", spec: "jarroh", type: "toliq", exp: "y5", salaryMin: 18_000_000, salaryMax: 25_000_000, posted: "4 kun oldin", fresh: 97, blurb: "Implantologiya jarroh kerak. Straumann/Nobel tizimlari bilan ishlash tajribasi afzal.", image: photos[3], verified: true },
  { id: "assistent-city", title: "Stomatolog assistent", clinic: "City Dental", city: "Toshkent", district: "Olmazor", spec: "assistent", type: "smena", exp: "yoq", salaryMin: 4_000_000, salaryMax: 6_000_000, posted: "1 hafta oldin", fresh: 96, blurb: "Stomatolog assistent lavozimiga qiziquvchilar. O‘qitish klinikada.", image: photos[4], verified: true },
  { id: "ortodont-newsmile", title: "Ortodont", clinic: "NewSmile", city: "Toshkent", district: "Yakkasaroy", spec: "ortodont", type: "toliq", exp: "y3", salaryMin: 15_000_000, salaryMax: 22_000_000, posted: "1 hafta oldin", fresh: 95, blurb: "Ortodontiya bo‘yicha to‘liq stavka. Elayner va breket tizimlari bilan ishlash.", image: photos[5], verified: true },
];

const clinics = ["Smile Dental Clinic", "DentaCare", "Family Dental", "Implant Plus", "City Dental", "NewSmile", "Apex Clinic", "Nura Dental"];
const districts = ["Yunusobod", "Chilonzor", "Mirzo Ulug‘bek", "Shayxontohur", "Olmazor", "Yakkasaroy", "Sergeli", "Uchtepa"];
const titles: Record<JobSpec, string> = {
  terapevt: "Terapevt stomatolog",
  ortoped: "Ortoped stomatolog",
  ortodont: "Ortodont",
  jarroh: "Jarroh-implantolog",
  bolalar: "Bolalar stomatologi",
  gigiyenist: "Gigiyenist",
  texnik: "Tish texnigi",
  assistent: "Stomatolog assistent",
  admin: "Klinika administratori",
};

function take<T>(bag: T[], n: number) {
  return bag.splice(0, n);
}

const cityBag = [
  ...Array(122).fill("Toshkent"),
  ...Array(18).fill("Samarqand"),
  ...Array(16).fill("Buxoro"),
  ...Array(22).fill("Andijon"),
  ...Array(14).fill("Farg‘ona"),
  ...Array(20).fill("Namangan"),
  ...Array(30).fill("Boshqa"),
];
const specBag: JobSpec[] = [
  ...Array(51).fill("terapevt"),
  ...Array(47).fill("ortoped"),
  ...Array(31).fill("ortodont"),
  ...Array(27).fill("jarroh"),
  ...Array(23).fill("bolalar"),
  ...Array(16).fill("gigiyenist"),
  ...Array(14).fill("texnik"),
  ...Array(17).fill("assistent"),
  ...Array(16).fill("admin"),
];
const typeBag: JobType[] = [
  ...Array(185).fill("toliq"),
  ...Array(28).fill("yarim"),
  ...Array(23).fill("smena"),
  ...Array(6).fill("masofa"),
];
const expBag: JobExp[] = [
  ...Array(11).fill("yoq"),
  ...Array(85).fill("y1"),
  ...Array(75).fill("y3"),
  ...Array(71).fill("y5"),
];

const extras: DesktopJob[] = [];
for (let i = 0; i < 242; i += 1) {
  const spec = specBag[i] ?? "terapevt";
  const type = typeBag[i] ?? "toliq";
  const exp = expBag[i] ?? "y1";
  const city = cityBag[i] ?? "Toshkent";
  const min = 4_000_000 + (i % 8) * 1_500_000;
  extras.push({
    id: `job-${i + 1}`,
    title: titles[spec],
    clinic: clinics[i % clinics.length],
    city,
    district: city === "Toshkent" ? districts[i % districts.length] : "Markaz",
    spec,
    type,
    exp,
    salaryMin: Math.min(min, 24_000_000),
    salaryMax: Math.min(min + 6_000_000, 30_000_000),
    posted: i % 4 === 0 ? "2 hafta oldin" : "3 hafta oldin",
    fresh: 40 - i * 0.01,
    blurb: `${titles[spec]} lavozimi. ${city}dagi klinikada doimiy ish va o‘sish imkoniyati.`,
    image: photos[i % photos.length],
    verified: i % 3 !== 2,
  });
}

export const desktopJobs: DesktopJob[] = [...featured, ...extras];

export const popularClinics = [
  { name: "Smile Dental Clinic", city: "Toshkent", openings: 12, image: photos[0] },
  { name: "DentaCare", city: "Toshkent", openings: 8, image: photos[1] },
  { name: "Family Dental", city: "Toshkent", openings: 6, image: photos[2] },
  { name: "Implant Plus", city: "Toshkent", openings: 5, image: photos[3] },
  { name: "City Dental", city: "Toshkent", openings: 5, image: photos[4] },
];

export const jobTips = [
  { title: "Rezyume qanday yoziladi?", text: "Lavozim, tajriba yillari va ishlagan klinikalarini qisqa yozing. Sertifikat va mutaxassislikni alohida qator qiling." },
  { title: "Suhbatga tayyorgarlik", text: "Klinika yo‘nalishini oldindan o‘qing. O‘z ishlaringizdan 2–3 ta misol tayyorlang." },
  { title: "Maosh haqida maslahatlar", text: "Kutilgan maoshni viloyat va tajribaga qarab yozing. Stavka va smena farqini aniq ayting." },
  { title: "Stomatologlar uchun karera imkoniyatlari", text: "Terapiyadan implantologiya va ortodontiyaga o‘tish uchun amaliyot va sertifikat kerak." },
  { title: "Eng talabgir mutaxassisliklar", text: "Hozir ortoped, bolalar stomatologi va implantolog lavozimlari ko‘proq ochiq." },
];

export type DesktopResume = {
  id: string;
  name: string;
  spec: string;
  city: string;
  exp: string;
  salary: string;
};

export const seedResumes: DesktopResume[] = [
  { id: "r1", name: "Dr. Madina Karimova", spec: "Terapevt", city: "Toshkent", exp: "5 yil", salary: "12 mln so‘m" },
  { id: "r2", name: "Dr. Jasur Aliyev", spec: "Ortoped", city: "Samarqand", exp: "8 yil", salary: "15 mln so‘m" },
  { id: "r3", name: "Nilufar Yusupova", spec: "Assistent", city: "Toshkent", exp: "1 yil", salary: "5 mln so‘m" },
  { id: "r4", name: "Dr. Bekzod Rahimov", spec: "Ortodont", city: "Andijon", exp: "6 yil", salary: "16 mln so‘m" },
];
