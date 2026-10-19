import { desktopCourses, type DesktopCourse } from "@/data/desktop-courses";
import { videoLessons } from "@/data/education";
import { continueLesson, mobileLessons, type MobileLesson } from "@/data/mobile-lessons";

export type CourseLesson = {
  title: string;
  minutesLabel: string;
  durationSec: number;
  done: boolean;
  locked: boolean;
};

export type CourseComment = {
  name: string;
  avatar: string;
  when: string;
  text: string;
};

export type CourseMaterial = {
  name: string;
  detail: string;
};

export type VideoCourse = {
  id: string;
  title: string;
  author: string;
  role: string;
  avatar: string;
  poster: string;
  videoSrc: string;
  viewsLabel: string;
  progressDone: number;
  progressTotal: number;
  progressPercent: number;
  lessons: CourseLesson[];
  startIndex: number;
  startSec: number;
  about: string[];
  materials: CourseMaterial[];
  comments: CourseComment[];
  commentCount: number;
};

const SAMPLE = "/video/lesson-sample.mp4";

const ROLE: Record<MobileLesson["topic"], string> = {
  terapiya: "Terapevt-stomatolog",
  implantologiya: "Implantolog",
  endodontiya: "Endodontist",
  ortodontiya: "Ortodont",
  estetika: "Estetik stomatolog",
  raqamli: "Raqamli stomatologiya",
};

const STEP_TITLES = [
  "Kirish va ko‘rsatkichlar",
  "Klinik ko‘rik",
  "Asosiy texnika",
  "Ishchi uzunlik",
  "Mexanik ishlov",
  "Irrigatsiya",
  "Yakuniy bosqich",
  "Klinik holat",
  "Nazorat savollari",
  "Amaliy mashq",
  "Muhokama",
  "Xulosa",
];

const STEP_MINUTES = [18, 24, 28, 22, 26, 20, 32, 30, 24, 22, 28, 16];

function lessonOf(title: string, minutes: number, done: boolean, locked: boolean, seconds = minutes * 60): CourseLesson {
  return { title, minutesLabel: `${minutes} daqiqa`, durationSec: seconds, done, locked };
}

const designCourse: VideoCourse = {
  id: "kanal-davolash",
  title: "Endodontiya: kanal davolash asoslari",
  author: "Dr. Azizbek Rahimov",
  role: "Endodontist, PhD",
  avatar: "/img/mobile/tl-azizbek.jpg",
  poster: "/img/mobile/tl-endo.jpg",
  videoSrc: SAMPLE,
  viewsLabel: "12.4K",
  progressDone: 3,
  progressTotal: 12,
  progressPercent: 25,
  startIndex: 2,
  startSec: 12 * 60 + 35,
  lessons: [
    lessonOf("Endodontiyaga kirish", 18, true, false),
    lessonOf("Tish anatomiyasi va kanal tizimi", 24, true, false),
    lessonOf("Kanal davolash asoslari", 28, false, false, 28 * 60 + 10),
    lessonOf("Ishchi uzunlikni aniqlash", 22, false, true),
    lessonOf("Kanalni mexanik ishlov berish", 26, false, true),
    lessonOf("Irrigatsiya va dezinfeksiya", 20, false, true),
    lessonOf("Kanalni obturatsiya qilish", 32, false, true),
    lessonOf("Klinik holatlar tahlili", 30, false, true),
    lessonOf("Murakkab kanal anatomiyasi", 24, false, true),
    lessonOf("Asbob sinishi va oldini olish", 22, false, true),
    lessonOf("Qayta davolash", 28, false, true),
    lessonOf("Yakuniy xulosa", 18, false, true),
  ],
  about: [
    "Bu kurs endodontik davolashning amaliy bosqichlarini yoritadi: tashxis, ishchi uzunlik, mexanik ishlov, irrigatsiya va obturatsiya.",
    "Dr. Azizbek Rahimov har bir bosqichni klinik holatlar bilan tushuntiradi. Dars oxirida o‘z amaliyotingizda qo‘llash uchun qisqa bayonnoma beriladi.",
    "Kimlar uchun: umumiy amaliyot shifokorlari va endodontiya bo‘yicha malaka oshirayotgan stomatologlar.",
  ],
  materials: [
    { name: "Kanal davolash protokoli.pdf", detail: "1.2 MB" },
    { name: "Ishchi uzunlik jadvali.pdf", detail: "480 KB" },
    { name: "Irrigatsiya sxemasi.pdf", detail: "860 KB" },
  ],
  comments: [
    {
      name: "Dr. Madina Yusupova",
      avatar: "/img/mobile/se-dilnoza.jpg",
      when: "2 kun oldin",
      text: "Ishchi uzunlikni elektron apexslokator bilan tekshirish qismi juda aniq tushuntirilgan.",
    },
    {
      name: "Dr. Jasur Alimov",
      avatar: "/img/mobile/se-sardor-face.jpg",
      when: "5 kun oldin",
      text: "Irrigatsiya ketma-ketligi amaliyotda darhol qo‘l keladi.",
    },
    {
      name: "Dr. Nigora Saidova",
      avatar: "/img/mobile/tl-nigora.jpg",
      when: "1 hafta oldin",
      text: "Obturatsiya bo‘yicha misollar foydali. Keyingi darsni kutaman.",
    },
    {
      name: "Dr. Komil Abdullaev",
      avatar: "/img/mobile/tl-komiljon.jpg",
      when: "2 hafta oldin",
      text: "Boshlang‘ich shifokorlar uchun ham tushunarli, lekin klinik holatlar chuqur.",
    },
  ],
  commentCount: 24,
};

function fromLesson(lesson: MobileLesson): VideoCourse {
  const total = Math.max(1, lesson.lessons);
  const doneCount =
    lesson.progress != null
      ? Math.min(total - 1, Math.max(0, Math.round((total * lesson.progress) / 100)))
      : Math.min(2, Math.max(0, total - 1));
  const startIndex = Math.min(doneCount, total - 1);
  const percent = lesson.progress ?? Math.round((doneCount / total) * 100);
  const lessons = Array.from({ length: total }, (_, index) =>
    lessonOf(STEP_TITLES[index] ?? `Dars ${index + 1}`, STEP_MINUTES[index] ?? 20, index < startIndex, index > startIndex),
  );
  return {
    id: lesson.id,
    title: lesson.title,
    author: lesson.author,
    role: ROLE[lesson.topic],
    avatar: lesson.avatar,
    poster: lesson.image,
    videoSrc: SAMPLE,
    viewsLabel: lesson.viewsLabel,
    progressDone: doneCount,
    progressTotal: total,
    progressPercent: percent,
    lessons,
    startIndex,
    startSec: 0,
    about: [
      `${lesson.title} — ${lesson.topicLabel} yo‘nalishidagi amaliy video kurs. ${lesson.author} bosqichma-bosqich ko‘rsatadi.`,
      `Daraja: ${lesson.levelLabel}. Kursda ${lesson.lessons} ta dars, davomiyligi ${lesson.duration}.`,
      "Har bir dars oxirida qisqa xulosa va amaliyotda qo‘llash uchun eslatma beriladi.",
    ],
    materials: [
      { name: `${lesson.topicLabel} bayonnomasi.pdf`, detail: "1.1 MB" },
      { name: "Amaliy checklist.pdf", detail: "240 KB" },
    ],
    comments: [
      {
        name: "Dr. Madina Yusupova",
        avatar: "/img/mobile/se-dilnoza.jpg",
        when: "3 kun oldin",
        text: `${lesson.title} bo‘yicha tushuntirish aniq. Klinik qadamlar tartibli.`,
      },
      {
        name: "Dr. Jasur Alimov",
        avatar: "/img/mobile/se-sardor-face.jpg",
        when: "1 hafta oldin",
        text: "Materiallar dars bilan mos. Checklistni qabulxonada ishlatib ko‘rdim.",
      },
    ],
    commentCount: 8,
  };
}

function fromDesktop(course: DesktopCourse): VideoCourse {
  const total = Math.min(12, Math.max(6, Math.round(course.hours)));
  // Catalog courses are not sold yet: only the first lesson is an open preview, nothing is "done".
  const startIndex = 0;
  const lessons = Array.from({ length: total }, (_, index) =>
    lessonOf(STEP_TITLES[index] ?? `Dars ${index + 1}`, STEP_MINUTES[index] ?? 20, false, index > 0),
  );
  return {
    id: course.id,
    title: course.title,
    author: course.teacher,
    role: course.role,
    avatar: course.avatar,
    poster: course.image,
    videoSrc: SAMPLE,
    viewsLabel: course.students >= 1000 ? `${(course.students / 1000).toFixed(1)}K` : String(course.students),
    progressDone: startIndex,
    progressTotal: total,
    progressPercent: Math.round((startIndex / total) * 100),
    lessons,
    startIndex,
    startSec: 0,
    about: [
      `${course.title} — ${course.hours} soatlik professional kurs. ${course.teacher} (${course.role}) amaliy bosqichlarni ko‘rsatadi.`,
      "Kurs hali sotuvga chiqmagan — birinchi dars namuna sifatida ochiq.",
    ],
    materials: [
      { name: "Dars bayonnomasi.pdf", detail: "1.1 MB" },
      { name: "Amaliy checklist.pdf", detail: "240 KB" },
    ],
    comments: designCourse.comments.slice(0, 2),
    commentCount: Math.min(course.reviews, 24),
  };
}

export function resolveVideoCourse(id: string): VideoCourse {
  if (id === designCourse.id) return designCourse;
  const lesson = [continueLesson, ...mobileLessons].find((item) => item.id === id);
  if (lesson) return fromLesson(lesson);
  const video = videoLessons.find((item) => item.id === id);
  if (video) {
    return fromLesson({
      ...continueLesson,
      id: video.id,
      title: video.title,
      image: video.image,
      duration: video.duration,
      progress: undefined,
      lessons: 6,
    });
  }
  const desktop = desktopCourses.find((item) => item.id === id);
  if (desktop) return fromDesktop(desktop);
  return { ...designCourse, id: id || designCourse.id };
}
