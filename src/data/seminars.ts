import { realSeminars } from "@/data/real-seminars";
import { SEMINAR_DATE_TBD as SEMINAR_DATE_TBD_VALUE, formatUzDate } from "@/lib/format";

export type Specialty =
  | "implantologiya"
  | "endodontiya"
  | "estetika"
  | "ortodontiya"
  | "kongress";

export type SeminarCity = "Toshkent" | "Samarqand" | "Online";

export type SeminarSpeaker = {
  name: string;
  role: string;
  photo?: string;
  city?: string;
  bio?: string;
};

export type SeminarGalleryItem = {
  image: string;
  caption?: string;
  subtitle?: string;
  /** A still image (poster) — opens in the viewer instead of the "video" play overlay. */
  still?: boolean;
};

/** One day of a multi-day seminar: topics + timed schedule. */
export type SeminarProgramDay = {
  /** e.g. "1-kun" */
  label: string;
  /** e.g. "Nazariya" */
  title: string;
  /** e.g. "21-oktyabr" */
  date?: string;
  topics: string[];
  schedule: { time: string; title: string }[];
};

export type Seminar = {
  id: string;
  title: string;
  date: string;
  time: string;
  timeEnd: string;
  city: SeminarCity;
  venue: string;
  speaker: string;
  speakerRole: string;
  speakerAvatar?: string;
  /** Multiple speakers — preferred over single speaker fields when present. */
  speakers?: SeminarSpeaker[];
  /** What participants will learn (Nima o'rganasiz). */
  learnings?: string[];
  /** Past seminar posters/photos gallery. */
  pastGallery?: SeminarGalleryItem[];
  specialty: Specialty;
  price: number;
  /** Optional pre-discount price (shown crossed out with -N%). */
  oldPrice?: number;
  seatsTaken: number;
  seatsTotal: number;
  image: string;
  description?: string;
  featured?: boolean;
  demo?: true;
  /** Organizer-created seminar loaded from the database (not part of the static seed). */
  remote?: boolean;
  /** Organizer's own tags (DB seminars). */
  tags?: string[];
  /** Organizer's own program steps (DB seminars). */
  program?: { time: string; title: string }[];
  /** Lifecycle status of a DB seminar (published | closed). */
  status?: string;
  /** Real date not announced yet: `date` holds the internal SEMINAR_DATE_TBD placeholder and the UI shows "Sana aniqlanmoqda". */
  dateTbd?: boolean;
  /** Last day of a multi-day seminar (YYYY-MM-DD). */
  dateEnd?: string;
  /** Seat count not announced: `seatsTotal` is only an internal registration cap; the UI shows "Joylar soni cheklangan". */
  seatsTbd?: boolean;
  /** Organizer (Tashkilotchi) name shown on cards and the detail page. */
  organizer?: string;
  /** Short format badge, e.g. "Ikki kunlik seminar". */
  badge?: string;
  /** Explicit feature cards (all shown as active), instead of keyword-derived ones. */
  features?: { title: string; subtitle: string }[];
  /** Multi-day program (day tabs/headings). */
  programDays?: SeminarProgramDay[];
  /** Portrait image for the mobile hero (falls back to speaker photo / cover). */
  heroImage?: string;
};

/** Internal placeholder date for seminars whose date is not announced yet (never shown — see `dateTbd`). */
export { SEMINAR_DATE_TBD } from "@/lib/format";

export const specialtyLabels: Record<Specialty, string> = {
  implantologiya: "Implantologiya",
  endodontiya: "Endodontiya",
  estetika: "Estetika",
  ortodontiya: "Ortodontiya",
  kongress: "Kongress",
};

export const seminarCities: SeminarCity[] = ["Toshkent", "Samarqand", "Online"];

export const seminars: Seminar[] = [
  ...realSeminars,
  {
    id: "impl-grand-mir",
    title: "Implantologiyada Zamonaviy Yondashuvlar: Nazariyadan Amaliyotgacha",
    date: "2026-09-16",
    time: "09:00",
    timeEnd: "17:00",
    city: "Toshkent",
    venue: "Grand Mir Hotel",
    speaker: "Dr. Jasur Rakhimov",
    speakerRole: "Implantolog, PhD, 15+ yillik tajriba",
    speakerAvatar: "/images/usta-featured.png",
    specialty: "implantologiya",
    price: 2_500_000,
    oldPrice: 3_000_000,
    seatsTaken: 28,
    seatsTotal: 40,
    image: "/images/seminar-featured.png",
    description:
      "Yetakchi mutaxassis bilan ikki kunlik amaliy seminar. Live-surgery va qo‘l ustida mashg‘ulotlar.",
    speakers: [
      {
        name: "Dr. Jasur Rakhimov",
        role: "Implantolog, PhD",
        photo: "/images/usta-featured.png",
        city: "Toshkent",
        bio: "15+ yillik tajriba, full-arch va sinus lifting bo‘yicha mentor.",
      },
      {
        name: "Dr. Sanjar Salomov",
        role: "Implantolog, PhD",
        photo: "/images/usta-sardor.png",
        city: "Toshkent",
        bio: "Digital guide va immediate loading protokollari.",
      },
      {
        name: "Dr. Dilshod Tursunov",
        role: "Oral jarroh",
        photo: "/images/usta-jamshid.png",
        city: "Toshkent",
        bio: "Bone augmentation va soft tissue management.",
      },
    ],
    learnings: [
      "Implant rejalashtirish va CBCT tahlili",
      "Suyak augmentatsiyasi usullari",
      "Bosqichma-bosqich joylashtirish protokoli",
      "Protezlash yondashuvlari",
      "Asoratlarni boshqarish",
      "Raqamli stomatologiya yangiliklari",
    ],
    pastGallery: [
      {
        image: "/images/seminar-implants-macro.png",
        caption: "Soft Tissue Management",
        subtitle: "Samarqand, 2025",
      },
      {
        image: "/images/seminar-lecture.png",
        caption: "Live surgery sessiyasi",
        subtitle: "Toshkent, Grand Mir",
      },
      {
        image: "/images/seminar-implant.png",
        caption: "Hands-on stollar",
        subtitle: "Amaliy mashg‘ulot",
      },
      {
        image: "/images/seminar-congress.png",
        caption: "Sertifikat topshiruvi",
        subtitle: "Ishtirokchilar bilan",
      },
    ],
    featured: true,
    demo: true,
  },
  {
    id: "endo-complex",
    title: "Endodontiyada Murakkab Holatlar",
    date: "2026-09-23",
    time: "10:00",
    timeEnd: "16:00",
    city: "Toshkent",
    venue: "Dental Education Center",
    speaker: "Dr. Nodira Karimova",
    speakerRole: "Endodontist, PhD",
    speakerAvatar: "/images/forma-banner-doctor.png",
    specialty: "endodontiya",
    price: 1_200_000,
    seatsTaken: 12,
    seatsTotal: 20,
    image: "/images/seminar-implants-macro.png",
    description:
      "Murakkab anatomiya, retreatment va broken instrument holatlari. Mikroskop va CBCT protokoli.",
    speakers: [
      {
        name: "Dr. Nodira Karimova",
        role: "Endodontist, PhD",
        photo: "/images/forma-banner-doctor.png",
        city: "Toshkent",
      },
      {
        name: "Dr. Dilshod Tursunov",
        role: "Endodontist",
        photo: "/images/usta-jamshid.png",
        city: "Toshkent",
      },
    ],
    learnings: [
      "Murakkab anatomiyani CBCT da o‘qish",
      "Broken instrument retrieval",
      "Retreatment bosqichma-bosqich",
      "Mikroskop ostida obturatsiya",
    ],
    pastGallery: [
      { image: "/images/seminar-scope.png", caption: "Mikroskop sessiyasi", subtitle: "Nexus Clinic" },
      { image: "/images/seminar-xray.png", caption: "CBCT tahlil", subtitle: "Case discussion" },
      { image: "/images/seminar-lecture.png", caption: "Nazariy blok", subtitle: "2025" },
    ],
    demo: true,
  },
  {
    id: "estetik-trends",
    title: "Estetik Stomatologiya: Yangi Trendlar",
    date: "2026-09-30",
    time: "09:30",
    timeEnd: "16:00",
    city: "Samarqand",
    venue: "Registon Medical",
    speaker: "Dr. Kamola Abdullayeva",
    speakerRole: "Estetik stomatolog",
    speakerAvatar: "/images/avatar-azizbek.png",
    specialty: "estetika",
    price: 1_500_000,
    seatsTaken: 18,
    seatsTotal: 25,
    image: "/images/seminar-smile.png",
    description:
      "Veneer, bleaching va smile design. Samarqanddagi amaliy demo va foto protokol.",
    speakers: [
      {
        name: "Dr. Kamola Abdullayeva",
        role: "Estetik stomatolog",
        photo: "/images/avatar-azizbek.png",
        city: "Samarqand",
        bio: "Smile design va veneer bo‘yicha 10+ yillik amaliyot.",
      },
      {
        name: "Dr. Aziz Karimov",
        role: "Estetik restavrator",
        photo: "/images/usta-akbar.png",
        city: "Toshkent",
      },
      {
        name: "Dr. Nigora Raximova",
        role: "Dental photographer",
        photo: "/images/forma-banner-doctor.png",
        city: "Toshkent",
      },
    ],
    learnings: [
      "Veneer va estetik restavratsiya",
      "Smile design va raqamli rejalashtirish",
      "Bleaching: zamonaviy usullar",
      "Amaliyot va case ko‘rib chiqish",
      "Dental photography asoslari",
      "Adhesive protokol va cementlash",
    ],
    pastGallery: [
      { image: "/images/seminar-smile.png", caption: "Smile design demo", subtitle: "Samarqand, 2025" },
      { image: "/images/seminar-lecture.png", caption: "Konferensiya zali", subtitle: "Qizg‘in muhokama" },
      { image: "/images/seminar-featured.png", caption: "Hands-on", subtitle: "Veneer prep" },
      { image: "/images/seminar-congress.png", caption: "Guruh fotosessiyasi", subtitle: "Ishtirokchilar" },
    ],
    demo: true,
  },
  {
    id: "ortho-plan",
    title: "Ortodontiya: Zamonaviy Tekshiruv va Rejalashtirish",
    date: "2026-10-07",
    time: "10:00",
    timeEnd: "15:00",
    city: "Online",
    venue: "Online",
    speaker: "Dr. Farrukh Khaydarov",
    speakerRole: "Ortodontist",
    speakerAvatar: "/images/usta-akbar.png",
    specialty: "ortodontiya",
    price: 800_000,
    seatsTaken: 40,
    seatsTotal: 80,
    image: "/images/seminar-braces.png",
    description:
      "Online webinar: 3D skaner, aligner rejalashtirish va retention. Savol-javob sessiyasi.",
    demo: true,
  },
  {
    id: "impl-complex",
    title: "Kombinatsiyalangan Implantologik Davolash",
    date: "2026-10-13",
    time: "09:00",
    timeEnd: "17:00",
    city: "Toshkent",
    venue: "Hyatt Regency",
    speaker: "Dr. Sanjar Salomov",
    speakerRole: "Implantolog, PhD",
    speakerAvatar: "/images/usta-sardor.png",
    specialty: "implantologiya",
    price: 2_000_000,
    oldPrice: 2_400_000,
    seatsTaken: 15,
    seatsTotal: 30,
    image: "/images/seminar-lecture.png",
    description:
      "Full-arch va kombinatsiyalangan protezlash. Live case discussion, Hyatt Regency Toshkent.",
    speakers: [
      {
        name: "Dr. Sanjar Salomov",
        role: "Implantolog, PhD",
        photo: "/images/usta-sardor.png",
        city: "Toshkent",
      },
      {
        name: "Dr. Jasur Rakhimov",
        role: "Implantolog, PhD",
        photo: "/images/usta-featured.png",
        city: "Toshkent",
      },
    ],
    learnings: [
      "Full-arch rejalashtirish",
      "Kombinatsiyalangan protezlash",
      "Live case discussion",
      "Immediate loading mezonlari",
    ],
    pastGallery: [
      { image: "/images/seminar-lecture.png", caption: "Hyatt sessiyasi", subtitle: "2025" },
      { image: "/images/seminar-implant.png", caption: "Case review", subtitle: "Full-arch" },
    ],
    demo: true,
  },
  {
    id: "endo-micro",
    title: "Mikroskop Yordamida Endodontik Davolash",
    date: "2026-10-20",
    time: "14:00",
    timeEnd: "18:00",
    city: "Toshkent",
    venue: "Nexus Clinic",
    speaker: "Dr. Dilshod Tursunov",
    speakerRole: "Endodontist",
    speakerAvatar: "/images/usta-jamshid.png",
    specialty: "endodontiya",
    price: 1_100_000,
    seatsTaken: 14,
    seatsTotal: 15,
    image: "/images/seminar-scope.png",
    description:
      "Mikroskop ostida kanal ishlov berish. Cheklangan o‘rinlar — hands-on stollar.",
    demo: true,
  },
  {
    id: "congress-2025",
    title: "Stomatologiya Kongressi 2026",
    date: "2026-10-28",
    time: "09:00",
    timeEnd: "18:00",
    city: "Toshkent",
    venue: "Toshkent City Congress Hall",
    speaker: "Bir necha xalqaro spikerlar",
    speakerRole: "Xalqaro konferensiya",
    speakerAvatar: "/images/seminar-congress.png",
    specialty: "kongress",
    price: 1_800_000,
    seatsTaken: 100,
    seatsTotal: 250,
    image: "/images/seminar-congress.png",
    description:
      "Yillik kongress: implantologiya, digital dentistry, endodontiya. Parallel zal va exhibition.",
    speakers: [
      {
        name: "Dr. Jasur Rakhimov",
        role: "Implantolog, PhD",
        photo: "/images/usta-featured.png",
        city: "Toshkent",
      },
      {
        name: "Dr. Nodira Karimova",
        role: "Endodontist, PhD",
        photo: "/images/forma-banner-doctor.png",
        city: "Toshkent",
      },
      {
        name: "Dr. Kamola Abdullayeva",
        role: "Estetik stomatolog",
        photo: "/images/avatar-azizbek.png",
        city: "Samarqand",
      },
      {
        name: "Dr. Farrukh Khaydarov",
        role: "Ortodontist",
        photo: "/images/usta-akbar.png",
        city: "Toshkent",
      },
    ],
    learnings: [
      "Zamonaviy implantologiya tendensiyalari",
      "Digital dentistry workflow",
      "Endodontiya yangiliklari",
      "Exhibition va networking",
      "Parallel master-klasslar",
      "Sertifikat va CME ballari",
    ],
    pastGallery: [
      { image: "/images/seminar-congress.png", caption: "Kongress 2025", subtitle: "Toshkent City Hall" },
      { image: "/images/seminar-lecture.png", caption: "Asosiy zal", subtitle: "Keynote" },
      { image: "/images/seminar-featured.png", caption: "Exhibition", subtitle: "Hamkorlar" },
    ],
    demo: true,
  },
  {
    id: "impl-sinus-lift",
    title: "Sinus lifting va vertikal augmentatsiya",
    date: "2026-11-04",
    time: "09:00",
    timeEnd: "16:00",
    city: "Toshkent",
    venue: "Dental Hub",
    speaker: "Dr. Jasur Rakhimov",
    speakerRole: "Implantolog, PhD",
    speakerAvatar: "/images/usta-featured.png",
    specialty: "implantologiya",
    price: 2_200_000,
    seatsTaken: 10,
    seatsTotal: 24,
    image: "/images/seminar-implant.png",
    description: "Lateral va crestal sinus lifting, membrane tanlash, asoratlarni oldini olish.",
    demo: true,
  },
  {
    id: "endo-rotary",
    title: "Rotary endodontiya: protokol va tipik xatolar",
    date: "2026-11-08",
    time: "10:00",
    timeEnd: "15:00",
    city: "Online",
    venue: "Online",
    speaker: "Dr. Nodira Karimova",
    speakerRole: "Endodontist, PhD",
    speakerAvatar: "/images/forma-banner-doctor.png",
    specialty: "endodontiya",
    price: 650_000,
    seatsTaken: 55,
    seatsTotal: 100,
    image: "/images/seminar-xray.png",
    description: "NiTi fayllar, irrigatsiya va obturatsiya. Online demo + Q&A.",
    demo: true,
  },
  {
    id: "estetik-veneer",
    title: "Keramik veneer: prep va cementlash",
    date: "2026-11-12",
    time: "09:30",
    timeEnd: "17:00",
    city: "Toshkent",
    venue: "Smile Lab Academy",
    speaker: "Dr. Kamola Abdullayeva",
    speakerRole: "Estetik stomatolog",
    speakerAvatar: "/images/avatar-azizbek.png",
    specialty: "estetika",
    price: 1_700_000,
    seatsTaken: 8,
    seatsTotal: 16,
    image: "/images/seminar-smile.png",
    description: "Minimal prep, mock-up, adhesive protokol. Hands-on modellarda.",
    demo: true,
  },
  {
    id: "ortho-aligner",
    title: "Aligner terapiya: case selection",
    date: "2026-11-18",
    time: "11:00",
    timeEnd: "16:00",
    city: "Samarqand",
    venue: "Samarkand Dental Center",
    speaker: "Dr. Farrukh Khaydarov",
    speakerRole: "Ortodontist",
    speakerAvatar: "/images/usta-akbar.png",
    specialty: "ortodontiya",
    price: 1_000_000,
    seatsTaken: 20,
    seatsTotal: 35,
    image: "/images/seminar-braces.png",
    description: "Qaysi holatlarda aligner, qachon bracket. Retention strategiyasi.",
    demo: true,
  },
  {
    id: "impl-digital",
    title: "Digital implantologiya: guide va skaner",
    date: "2026-11-22",
    time: "09:00",
    timeEnd: "17:00",
    city: "Toshkent",
    venue: "Hyatt Regency",
    speaker: "Dr. Sanjar Salomov",
    speakerRole: "Implantolog, PhD",
    speakerAvatar: "/images/usta-sardor.png",
    specialty: "implantologiya",
    price: 2_400_000,
    seatsTaken: 12,
    seatsTotal: 28,
    image: "/images/seminar-lecture.png",
    description: "CBCT, surgical guide, IOS skaner bilan implant rejalashtirish.",
    demo: true,
  },
  {
    id: "endo-retreat",
    title: "Retreatment: broken instrument va perforation",
    date: "2026-11-26",
    time: "13:00",
    timeEnd: "18:00",
    city: "Toshkent",
    venue: "Nexus Clinic",
    speaker: "Dr. Dilshod Tursunov",
    speakerRole: "Endodontist",
    speakerAvatar: "/images/usta-jamshid.png",
    specialty: "endodontiya",
    price: 1_350_000,
    seatsTaken: 9,
    seatsTotal: 14,
    image: "/images/seminar-scope.png",
    description: "Mikroskop ostida retreatment. Live demo va amaliy stollar.",
    demo: true,
  },
  {
    id: "estetik-photo",
    title: "Dental photography va smile design",
    date: "2026-12-02",
    time: "10:00",
    timeEnd: "15:00",
    city: "Online",
    venue: "Online",
    speaker: "Dr. Kamola Abdullayeva",
    speakerRole: "Estetik stomatolog",
    speakerAvatar: "/images/avatar-azizbek.png",
    specialty: "estetika",
    price: 550_000,
    seatsTaken: 70,
    seatsTotal: 120,
    image: "/images/seminar-smile.png",
    description: "Foto protokol, light, DSD asoslari. Online master-klass.",
    demo: true,
  },
  {
    id: "ortho-kids",
    title: "Bolalar ortodontiyasi: erta aralashuv",
    date: "2026-12-05",
    time: "09:00",
    timeEnd: "14:00",
    city: "Toshkent",
    venue: "Kids Dental Club",
    speaker: "Dr. Farrukh Khaydarov",
    speakerRole: "Ortodontist",
    speakerAvatar: "/images/usta-akbar.png",
    specialty: "ortodontiya",
    price: 900_000,
    seatsTaken: 16,
    seatsTotal: 30,
    image: "/images/seminar-braces.png",
    description: "Interceptiv ortodontiya, habit breaking, funktsional apparatlar.",
    demo: true,
  },
  {
    id: "impl-soft-tissue",
    title: "Yumshoq to‘qima management implantlarda",
    date: "2026-12-09",
    time: "09:00",
    timeEnd: "16:00",
    city: "Toshkent",
    venue: "Grand Mir Hotel",
    speaker: "Dr. Jasur Rakhimov",
    speakerRole: "Implantolog, PhD",
    speakerAvatar: "/images/usta-featured.png",
    specialty: "implantologiya",
    price: 2_100_000,
    seatsTaken: 11,
    seatsTotal: 22,
    image: "/images/seminar-implants-macro.png",
    description: "CTG, FGG, emergence profile. Amaliy pig-jaw mashg‘uloti.",
    demo: true,
  },
  {
    id: "endo-pain",
    title: "Endodontik og‘riq va favqulodda holatlar",
    date: "2026-12-12",
    time: "14:00",
    timeEnd: "18:00",
    city: "Samarqand",
    venue: "Registon Medical",
    speaker: "Dr. Nodira Karimova",
    speakerRole: "Endodontist, PhD",
    speakerAvatar: "/images/forma-banner-doctor.png",
    specialty: "endodontiya",
    price: 750_000,
    seatsTaken: 22,
    seatsTotal: 40,
    image: "/images/seminar-xray.png",
    description: "Diagnostika, anesthesia, flare-up boshqaruvi.",
    demo: true,
  },
  {
    id: "kongress-winter",
    title: "Qishki stomatologiya forumi 2026",
    date: "2026-12-16",
    time: "09:00",
    timeEnd: "18:00",
    city: "Toshkent",
    venue: "Toshkent City Congress Hall",
    speaker: "Xalqaro va mahalliy spikerlar",
    speakerRole: "Forum",
    speakerAvatar: "/images/seminar-congress.png",
    specialty: "kongress",
    price: 1_500_000,
    seatsTaken: 60,
    seatsTotal: 200,
    image: "/images/seminar-congress.png",
    description: "Implantologiya, estetika, digital dentistry — parallel zallar.",
    demo: true,
  },
  {
    id: "estetik-comp",
    title: "Kompozit restavratsiya: anterior estetika",
    date: "2026-12-20",
    time: "10:00",
    timeEnd: "16:00",
    city: "Toshkent",
    venue: "Dental Education Center",
    speaker: "Dr. Kamola Abdullayeva",
    speakerRole: "Estetik stomatolog",
    speakerAvatar: "/images/avatar-azizbek.png",
    specialty: "estetika",
    price: 1_250_000,
    seatsTaken: 14,
    seatsTotal: 20,
    image: "/images/seminar-lecture.png",
    description: "Layering, polishing, rubber dam. Hands-on.",
    demo: true,
  },
  {
    id: "impl-immediate",
    title: "Immediate loading: qachon xavfsiz?",
    date: "2027-01-10",
    time: "09:00",
    timeEnd: "15:00",
    city: "Online",
    venue: "Online",
    speaker: "Dr. Sanjar Salomov",
    speakerRole: "Implantolog, PhD",
    speakerAvatar: "/images/usta-sardor.png",
    specialty: "implantologiya",
    price: 700_000,
    seatsTaken: 45,
    seatsTotal: 90,
    image: "/images/seminar-implant.png",
    description: "Primary stability, provisional, full-arch immediate.",
    demo: true,
  },
  {
    id: "ortho-wire",
    title: "Bracket biomechanics: asosiy egilishlar",
    date: "2027-01-15",
    time: "10:00",
    timeEnd: "16:00",
    city: "Toshkent",
    venue: "Ortho School",
    speaker: "Dr. Farrukh Khaydarov",
    speakerRole: "Ortodontist",
    speakerAvatar: "/images/usta-akbar.png",
    specialty: "ortodontiya",
    price: 1_100_000,
    seatsTaken: 18,
    seatsTotal: 28,
    image: "/images/seminar-braces.png",
    description: "Wire bending, torque, anchorage. Amaliy tipodent.",
    demo: true,
  },
  {
    id: "endo-cbct",
    title: "CBCT endodontiyada: o‘qish va qaror",
    date: "2027-01-20",
    time: "11:00",
    timeEnd: "15:00",
    city: "Toshkent",
    venue: "Nexus Clinic",
    speaker: "Dr. Dilshod Tursunov",
    speakerRole: "Endodontist",
    speakerAvatar: "/images/usta-jamshid.png",
    specialty: "endodontiya",
    price: 850_000,
    seatsTaken: 12,
    seatsTotal: 25,
    image: "/images/seminar-xray.png",
    description: "CBCT indikasiyalar, artefact, diagnostik protokol.",
    demo: true,
  },
  {
    id: "impl-periimplant",
    title: "Periimplantit: profilaktika va davolash",
    date: "2027-01-25",
    time: "09:30",
    timeEnd: "16:00",
    city: "Samarqand",
    venue: "Registon Medical",
    speaker: "Dr. Jasur Rakhimov",
    speakerRole: "Implantolog, PhD",
    speakerAvatar: "/images/usta-featured.png",
    specialty: "implantologiya",
    price: 1_900_000,
    seatsTaken: 7,
    seatsTotal: 20,
    image: "/images/seminar-implants-macro.png",
    description: "Diagnostika, non-surgical va surgical yondashuvlar.",
    demo: true,
  },
  {
    id: "kongress-spring",
    title: "Bahorgi stomatologiya kongressi 2027",
    date: "2027-03-12",
    time: "09:00",
    timeEnd: "18:00",
    city: "Toshkent",
    venue: "Toshkent City Congress Hall",
    speaker: "Xalqaro spikerlar",
    speakerRole: "Kongress",
    speakerAvatar: "/images/seminar-congress.png",
    specialty: "kongress",
    price: 2_000_000,
    seatsTaken: 30,
    seatsTotal: 300,
    image: "/images/seminar-congress.png",
    description: "Yillik bahorgi kongress — exhibition va master-klasslar.",
    demo: true,
  },
];

export const SEMINAR_CATALOG_COUNT = seminars.length;

/** Replace the organizer-created (DB) seminars inside the shared list; the static seed is untouched. */
export function setRemoteSeminars(list: Seminar[]) {
  for (let i = seminars.length - 1; i >= 0; i--) if (seminars[i].remote) seminars.splice(i, 1);
  const known = new Set(seminars.map((s) => s.id));
  for (const s of list) if (!known.has(s.id)) seminars.push(s);
}

export function seminarHref(id: string) {
  return `/seminarlar/${id}`;
}

export function seminarDayMonth(iso: string) {
  if (iso === SEMINAR_DATE_TBD_VALUE) return "Sana tez orada";
  const [, month, day] = iso.split("-");
  return `${day}/${month}`;
}

export function todayIso(from = new Date()) {
  const y = from.getFullYear();
  const m = String(from.getMonth() + 1).padStart(2, "0");
  const d = String(from.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isSeminarUpcoming(seminar: Seminar, from = new Date()) {
  if (seminar.status === "closed") return false; // organizer closed registration
  if (seminar.dateTbd) return true; // date not announced yet — registration stays open
  return (seminar.dateEnd ?? seminar.date) >= todayIso(from);
}

export function isDateTbd(seminar: Pick<Seminar, "date" | "dateTbd">) {
  return Boolean(seminar.dateTbd) || seminar.date === SEMINAR_DATE_TBD_VALUE;
}

/** formatUzDate for a seminar, aware of multi-day ranges (date … dateEnd) and the TBD placeholder. */
export function seminarDate(seminar: Pick<Seminar, "date" | "dateTbd" | "dateEnd">) {
  const d = formatUzDate(isDateTbd(seminar) ? SEMINAR_DATE_TBD_VALUE : seminar.date);
  if (isDateTbd(seminar) || !seminar.dateEnd || seminar.dateEnd === seminar.date) return d;
  const e = formatUzDate(seminar.dateEnd);
  if (e.month === d.month && e.year === d.year) {
    const dd = `${d.dayNum}–${e.dayNum}`;
    return { ...d, dayNum: dd, day: `${d.day}–${e.day}`, long: `${dd}-${d.month}, ${d.year}`, when: `${dd} ${d.monthTitle} ${d.year}` };
  }
  return { ...d, long: `${d.dayNum}-${d.month} – ${e.long}`, when: `${d.dayNum} ${d.monthTitle} – ${e.when}` };
}

/** "12 Oktyabr 2026", "21–22 Oktyabr 2026" or "Sana aniqlanmoqda". */
export function seminarWhen(seminar: Pick<Seminar, "date" | "dateTbd" | "dateEnd">) {
  return seminarDate(seminar).when;
}

/** Short seat line: real registrations if any, else the seat count, or "Joylar soni cheklangan" when not announced. */
export function seminarSeatsShort(seminar: Seminar, takenSuffix = "ishtirokchi") {
  const taken = Math.min(seminar.seatsTotal, seminar.seatsTaken);
  if (taken > 0) return `${taken} ${takenSuffix}`;
  return seminar.seatsTbd ? "Joylar soni cheklangan" : `${seminar.seatsTotal} o‘rin`;
}

/** Real (non-demo) featured upcoming seminars first, then by date. */
export function compareListed(a: Seminar, b: Seminar) {
  return Number(Boolean(b.featured && !b.demo)) - Number(Boolean(a.featured && !a.demo)) || compareSeminars(a, b);
}

export function compareSeminars(a: Seminar, b: Seminar) {
  return a.date.localeCompare(b.date) || a.time.localeCompare(b.time);
}

export function getSeminar(id: string) {
  return seminars.find((item) => item.id === id);
}

export function sortedSeminars() {
  return [...seminars].sort(compareSeminars);
}

export function upcomingSeminars(limit = 3, from = new Date()) {
  const upcoming = [...seminars].sort(compareListed).filter((item) => isSeminarUpcoming(item, from));
  return (upcoming.length ? upcoming : sortedSeminars()).slice(0, limit);
}

export function featuredSeminar(from = new Date()) {
  const upcoming = sortedSeminars().filter((item) => isSeminarUpcoming(item, from));
  return upcoming.find((item) => item.featured) ?? upcoming[0] ?? sortedSeminars()[0];
}


/** Resolve speakers list — prefers `speakers[]`, else single speaker fields. */
export function getSeminarSpeakers(seminar: Seminar): SeminarSpeaker[] {
  if (seminar.speakers && seminar.speakers.length > 0) return seminar.speakers.filter((sp) => sp.name);
  if (!seminar.speaker) return []; // speaker not announced yet
  return [
    {
      name: seminar.speaker,
      role: seminar.speakerRole,
      photo: seminar.speakerAvatar,
      city: seminar.city === "Online" ? undefined : seminar.city,
    },
  ];
}

/** Default learnings from description / specialty when not provided. */
export function getSeminarLearnings(seminar: Seminar): string[] {
  if (seminar.learnings && seminar.learnings.length > 0) return seminar.learnings;
  const label = specialtyLabels[seminar.specialty];
  const base = [
    `${label} bo‘yicha zamonaviy protokol`,
    "Amaliy case discussion",
    "Klinik xatolarni oldini olish",
    "Savol-javob va sertifikat",
  ];
  if (seminar.description) {
    const short = seminar.description.replace(/\s+/g, " ").trim();
    if (short.length > 20) base.unshift(short.length > 90 ? `${short.slice(0, 87)}…` : short);
  }
  return base.slice(0, 6);
}

/** Past gallery — uses seminar image + related catalog images as fallback. */
export function getSeminarPastGallery(seminar: Seminar): SeminarGalleryItem[] {
  if (seminar.remote) return [];
  if (seminar.pastGallery && seminar.pastGallery.length > 0) return seminar.pastGallery;
  const pool = [
    seminar.image,
    "/images/seminar-lecture.png",
    "/images/seminar-congress.png",
    "/images/seminar-featured.png",
    "/images/seminar-smile.png",
    "/images/seminar-implant.png",
  ];
  const unique = [...new Set(pool)].slice(0, 4);
  return unique.map((image, i) => ({
    image,
    caption: i === 0 ? specialtyLabels[seminar.specialty] : "Oldingi seminar",
    subtitle: seminar.city,
  }));
}

export function seatsLeft(seminar: Seminar) {
  return Math.max(0, seminar.seatsTotal - seminar.seatsTaken);
}
