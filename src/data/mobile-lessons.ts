export type LessonTopic = "terapiya" | "implantologiya" | "endodontiya" | "ortodontiya" | "estetika" | "raqamli";
export type LessonLevel = "boshlangich" | "orta";
export type LessonSort = "yangi" | "ommabop" | "narx";

export type MobileLesson = {
  id: string;
  title: string;
  topic: LessonTopic;
  topicLabel: string;
  level: LessonLevel;
  levelLabel: string;
  author: string;
  avatar: string;
  image: string;
  duration: string;
  views: number;
  viewsLabel: string;
  lessons: number;
  price: number;
  progress?: number;
};

export const lessonTopics: { id: "all" | LessonTopic; label: string }[] = [
  { id: "all", label: "Barchasi" },
  { id: "terapiya", label: "Terapiya" },
  { id: "implantologiya", label: "Implantologiya" },
  { id: "endodontiya", label: "Endodontiya" },
  { id: "ortodontiya", label: "Ortodontiya" },
];

export const lessonSorts: { id: LessonSort; label: string }[] = [
  { id: "yangi", label: "Yangilari" },
  { id: "ommabop", label: "Ommabop" },
  { id: "narx", label: "Narx" },
];

export const continueLesson: MobileLesson = {
  id: "kompozit-qatlam",
  title: "Kompozit restavratsiya: qatlamma usul",
  topic: "terapiya",
  topicLabel: "Terapiya",
  level: "orta",
  levelLabel: "O‘rta daraja",
  author: "Dr. Azizbek Murodov",
  avatar: "/img/mobile/tl-azizbek.jpg",
  image: "/img/mobile/tl-composite.jpg",
  duration: "16:42",
  views: 18400,
  viewsLabel: "18.4K",
  lessons: 9,
  price: 0,
  progress: 45,
};

export const mobileLessons: MobileLesson[] = [
  {
    id: "implant-bosqich",
    title: "Implant joylashtirish: bosqichma-bosqich",
    topic: "implantologiya",
    topicLabel: "Implantologiya",
    level: "boshlangich",
    levelLabel: "Boshlang‘ich",
    author: "Dr. Sardorbek Rahimov",
    avatar: "/img/mobile/se-sardor-face.jpg",
    image: "/img/mobile/tl-implant.jpg",
    duration: "22:15",
    views: 12400,
    viewsLabel: "12.4K",
    lessons: 8,
    price: 0,
  },
  {
    id: "endo-zamonaviy",
    title: "Endodontik davolash: zamonaviy yondashuv",
    topic: "endodontiya",
    topicLabel: "Endodontiya",
    level: "orta",
    levelLabel: "O‘rta daraja",
    author: "Dr. Dilnoza Karimova",
    avatar: "/img/mobile/se-dilnoza.jpg",
    image: "/img/mobile/tl-endo.jpg",
    duration: "18:30",
    views: 8700,
    viewsLabel: "8.7K",
    lessons: 6,
    price: 150_000,
  },
  {
    id: "estetik-old",
    title: "Estetik restavratsiya: old tishlar",
    topic: "estetika",
    topicLabel: "Estetika",
    level: "orta",
    levelLabel: "O‘rta daraja",
    author: "Dr. Azizbek Murodov",
    avatar: "/img/mobile/tl-azizbek.jpg",
    image: "/img/mobile/se-teeth.jpg",
    duration: "20:12",
    views: 15200,
    viewsLabel: "15.2K",
    lessons: 7,
    price: 120_000,
  },
  {
    id: "smile-design",
    title: "Digital Smile Design: amaliy qo‘llanma",
    topic: "raqamli",
    topicLabel: "Raqamli stomatologiya",
    level: "orta",
    levelLabel: "O‘rta daraja",
    author: "Dr. Nigora Saidova",
    avatar: "/img/mobile/tl-nigora.jpg",
    image: "/img/mobile/tl-smile.jpg",
    duration: "28:45",
    views: 10100,
    viewsLabel: "10.1K",
    lessons: 5,
    price: 150_000,
  },
  {
    id: "orto-asos",
    title: "Ortodontik davolash asoslari",
    topic: "ortodontiya",
    topicLabel: "Ortodontiya",
    level: "boshlangich",
    levelLabel: "Boshlang‘ich",
    author: "Dr. Komiljon Abdullaev",
    avatar: "/img/mobile/tl-komiljon.jpg",
    image: "/img/mobile/tl-braces.jpg",
    duration: "25:18",
    views: 9300,
    viewsLabel: "9.3K",
    lessons: 6,
    price: 0,
  },
];
