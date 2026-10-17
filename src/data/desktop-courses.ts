export type CourseTopic =
  | "implantologiya"
  | "endodontiya"
  | "ortopediya"
  | "terapiya"
  | "ortodontiya"
  | "jarrohlik"
  | "gigiyena"
  | "raqamli"
  | "management";

export type CourseLevel = "boshlangich" | "orta" | "ilgor";
export type CourseBadge = "bestseller" | "yangi" | "ommabop" | "professional";
export type CourseSort = "mashhurlik" | "reyting" | "arzon" | "qimmat";
export type CoursePrice = "" | "low" | "mid" | "high";

export type DesktopCourse = {
  id: string;
  title: string;
  topic: CourseTopic;
  level: CourseLevel;
  badge?: CourseBadge;
  hours: number;
  teacher: string;
  role: string;
  avatar: string;
  image: string;
  rating: number;
  reviews: number;
  students: number;
  price: number;
  popularity: number;
};

export const courseTopics: { id: CourseTopic; label: string }[] = [
  { id: "implantologiya", label: "Implantologiya" },
  { id: "endodontiya", label: "Endodontiya" },
  { id: "ortopediya", label: "Ortopediya" },
  { id: "terapiya", label: "Terapiya" },
  { id: "ortodontiya", label: "Ortodontiya" },
  { id: "jarrohlik", label: "Jarrohlik" },
  { id: "gigiyena", label: "Gigiyena" },
  { id: "raqamli", label: "Raqamli stomatologiya" },
  { id: "management", label: "Management" },
];

export const courseLevels: { id: CourseLevel; label: string }[] = [
  { id: "boshlangich", label: "Boshlang‘ich" },
  { id: "orta", label: "O‘rta" },
  { id: "ilgor", label: "Ilg‘or" },
];

export const coursePrices: { id: Exclude<CoursePrice, "">; label: string }[] = [
  { id: "low", label: "250 000 gacha" },
  { id: "mid", label: "250 000 – 350 000" },
  { id: "high", label: "350 000 dan yuqori" },
];

export const courseBadgeLabel: Record<CourseBadge, string> = {
  bestseller: "Bestseller",
  yangi: "Yangi",
  ommabop: "Ommabop",
  professional: "Professional",
};

export const desktopCourses: DesktopCourse[] = [
  {
    id: "implant-nazariya",
    title: "Implantologiya: nazariya va klinik amaliyot",
    topic: "implantologiya",
    level: "ilgor",
    badge: "bestseller",
    hours: 12,
    teacher: "Dr. Sardor Karimov",
    role: "Implantolog",
    avatar: "/img/mobile/se-sardor-face.jpg",
    image: "/img/design-pr13/courses/implant-nazariya.png",
    rating: 4.9,
    reviews: 320,
    students: 1200,
    price: 450000,
    popularity: 1,
  },
  {
    id: "endo-kanal",
    title: "Endodontiya: kanal davolash asoslari",
    topic: "endodontiya",
    level: "orta",
    badge: "yangi",
    hours: 8,
    teacher: "Dr. Nigora Aliyeva",
    role: "Endodontist",
    avatar: "/img/mobile/tl-nigora.jpg",
    image: "/img/design-pr13/courses/endo-kanal.png",
    rating: 4.8,
    reviews: 210,
    students: 860,
    price: 280000,
    popularity: 2,
  },
  {
    id: "ortoped-krona",
    title: "Ortopedik davolash: kronalar va ko‘priklar",
    topic: "ortopediya",
    level: "orta",
    badge: "ommabop",
    hours: 10,
    teacher: "Dr. Alisher To‘xtayev",
    role: "Ortoped",
    avatar: "/img/mobile/tl-komiljon.jpg",
    image: "/img/design-pr13/courses/ortoped-krona.png",
    rating: 4.7,
    reviews: 190,
    students: 750,
    price: 320000,
    popularity: 3,
  },
  {
    id: "terapiya-kompozit",
    title: "Terapiya: kompozit materiallar bilan ishlash",
    topic: "terapiya",
    level: "boshlangich",
    hours: 6,
    teacher: "Dr. Malika Yo‘ldosheva",
    role: "Terapevt",
    avatar: "/img/mobile/se-dilnoza.jpg",
    image: "/img/design-pr13/courses/terapiya-kompozit.png",
    rating: 4.8,
    reviews: 160,
    students: 640,
    price: 250000,
    popularity: 4,
  },
  {
    id: "ortodont-zamonaviy",
    title: "Ortodontiya: zamonaviy yondashuvlar",
    topic: "ortodontiya",
    level: "orta",
    hours: 9,
    teacher: "Dr. Azizbek Mirzayev",
    role: "Ortodont",
    avatar: "/img/mobile/tl-azizbek.jpg",
    image: "/img/design-pr13/courses/ortodont-zamonaviy.png",
    rating: 4.7,
    reviews: 140,
    students: 520,
    price: 300000,
    popularity: 5,
  },
  {
    id: "jarrohlik-exo",
    title: "Jarrohlik amaliyoti: exodontiya va yumshoq to‘qimalar",
    topic: "jarrohlik",
    level: "ilgor",
    badge: "professional",
    hours: 14,
    teacher: "Dr. Kamol Raximov",
    role: "Jarroh",
    avatar: "/img/usta/azamat.jpg",
    image: "/img/design-pr13/courses/jarrohlik-exo.png",
    rating: 4.9,
    reviews: 280,
    students: 1100,
    price: 380000,
    popularity: 6,
  },
  {
    id: "gigiyena-tozalash",
    title: "Gigiyena va profilaktika: professional tozalash",
    topic: "gigiyena",
    level: "boshlangich",
    hours: 5,
    teacher: "Dr. Dilnoza Saidova",
    role: "Gigiyenist",
    avatar: "/img/profil/dilnoza.jpg",
    image: "/img/design-pr13/courses/gigiyena-tozalash.png",
    rating: 4.6,
    reviews: 120,
    students: 430,
    price: 180000,
    popularity: 7,
  },
  {
    id: "raqamli-cadcam",
    title: "Raqamli stomatologiya: skanerlar va CAD/CAM",
    topic: "raqamli",
    level: "ilgor",
    hours: 7,
    teacher: "Dr. Bobur Tursunov",
    role: "Raqamli stomatolog",
    avatar: "/img/usta/bobur.jpg",
    image: "/img/design-pr13/courses/raqamli-cadcam.png",
    rating: 4.8,
    reviews: 150,
    students: 580,
    price: 350000,
    popularity: 8,
  },
];

function norm(value: string) {
  return value.toLowerCase().replaceAll("‘", "'").replaceAll("’", "'").replaceAll("ʻ", "'");
}

function inPrice(price: number, band: CoursePrice) {
  if (band === "low") return price <= 250000;
  if (band === "mid") return price > 250000 && price <= 350000;
  if (band === "high") return price > 350000;
  return true;
}

export function filterCourses(
  list: DesktopCourse[],
  opts: { q: string; topic: CourseTopic | ""; level: CourseLevel | ""; price: CoursePrice },
) {
  const q = norm(opts.q.trim());
  return list.filter((course) => {
    if (opts.topic && course.topic !== opts.topic) return false;
    if (opts.level && course.level !== opts.level) return false;
    if (!inPrice(course.price, opts.price)) return false;
    if (!q) return true;
    const topic = courseTopics.find((item) => item.id === course.topic)?.label ?? "";
    return norm(`${course.title} ${course.teacher} ${course.role} ${topic}`).includes(q);
  });
}

export function sortCourses(list: DesktopCourse[], sort: CourseSort) {
  const next = [...list];
  if (sort === "reyting") next.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews || a.popularity - b.popularity);
  else if (sort === "arzon") next.sort((a, b) => a.price - b.price || a.popularity - b.popularity);
  else if (sort === "qimmat") next.sort((a, b) => b.price - a.price || a.popularity - b.popularity);
  else next.sort((a, b) => a.popularity - b.popularity);
  return next;
}

export function studentsLabel(count: number) {
  const text = new Intl.NumberFormat("ru-RU").format(count).replace(/\u00a0/g, " ");
  return `${text} o‘quvchi`;
}
