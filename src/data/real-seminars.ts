import type { Seminar } from "@/data/seminars";

/**
 * REAL seminars supplied by the platform owner (not demo, never removed by cleanup).
 *
 * To fill in the details later, edit the entry below and redeploy:
 *  - Date:    `date` (first day) and `dateEnd` (last day), YYYY-MM-DD. Unknown date → `date: SEMINAR_DATE_TBD` + `dateTbd: true`.
 *  - Speaker: set `speaker: "Dr. Ism Familiya"`, `speakerRole: "Implantolog"` (optional `speakerAvatar`). Empty → "Ma’ruzachi aniqlanmoqda".
 *  - Seats:   `seatsTotal` (free seats = seatsTotal − real registrations). Unknown → add `seatsTbd: true`.
 *  - Venue/city: `venue`, `city` ("Toshkent" | "Samarqand" | "Online").
 */
export const realSeminars: Seminar[] = [
  {
    id: "implantologiya-implantdan-tojgacha",
    title: "Implantologiya: Implantdan tojgacha",
    badge: "Ikki kunlik seminar",
    organizer: "Nucleos",
    date: "2026-10-21",
    dateEnd: "2026-10-22",
    time: "09:00",
    timeEnd: "18:00",
    city: "Toshkent",
    venue: "EMU Universiteti",
    // Speaker not announced yet — UI shows "Ma’ruzachi aniqlanmoqda".
    speaker: "",
    speakerRole: "",
    specialty: "implantologiya",
    price: 1_800_000,
    oldPrice: 2_000_000,
    seatsTaken: 0,
    seatsTotal: 30,
    image: "/images/seminar-implant-tojgacha-cover.webp",
    heroImage: "/images/seminar-implant-tojgacha-hero.webp",
    description:
      "Implantologiyada diagnostika, implant rejalashtirish, jarrohlik protokoli, implant o‘rnatish va implant usti protezlash bo‘yicha intensiv 2 kunlik seminar.",
    features: [
      { title: "Nazariya va protokollar", subtitle: "Implantatsiya bosqichlari" },
      { title: "Klinik case muhokama", subtitle: "Real klinik holatlar" },
      { title: "Amaliy mashg‘ulot", subtitle: "Implant o‘rnatish" },
      { title: "Sertifikat beriladi", subtitle: "Seminar yakunida" },
    ],
    programDays: [
      {
        label: "1-kun",
        title: "Nazariya",
        date: "21-oktyabr",
        topics: [
          "Implantologiyada diagnostika",
          "CBCT/KT tahlili",
          "Implantatsiyaga ko‘rsatma va qarshi ko‘rsatmalar",
          "Suyak hajmini baholash",
          "Implant pozitsiyasini rejalashtirish",
          "Implant diametri va uzunligini tanlash",
          "Jarrohlik protokollari",
          "Implant tizimlari",
        ],
        schedule: [
          { time: "09:00–09:30", title: "Ro‘yxatdan olish" },
          { time: "09:30–11:00", title: "Implantologiyada diagnostika" },
          { time: "11:00–11:15", title: "Kofe-breyk" },
          { time: "11:15–13:00", title: "KT tahlili va implant rejalashtirish" },
          { time: "13:00–14:00", title: "Tushlik" },
          { time: "14:00–16:00", title: "Implant pozitsiyasini tanlash" },
          { time: "16:00–16:15", title: "Kofe-breyk" },
          { time: "16:15–18:00", title: "Jarrohlik protokoli va klinik case" },
        ],
      },
      {
        label: "2-kun",
        title: "Amaliyot",
        date: "22-oktyabr",
        topics: [
          "Implant o‘rnatish bosqichlari",
          "Osteotomiya protokoli",
          "Implantni pozitsiyalash",
          "Birlamchi stabilizatsiya",
          "Flap va choklash texnikasi",
          "Healing abutment bilan ishlash",
          "Implant usti protezlash",
          "Abutment tanlash",
          "Vaqtinchalik va doimiy toj",
        ],
        schedule: [
          { time: "09:00–10:00", title: "Implantatsiyaga tayyorgarlik" },
          { time: "10:00–12:30", title: "Implant o‘rnatish amaliyoti" },
          { time: "12:30–13:00", title: "Kofe-breyk" },
          { time: "13:00–14:00", title: "Tushlik" },
          { time: "14:00–15:30", title: "Choklash texnikasi" },
          { time: "15:30–17:00", title: "Implant usti protezlash" },
          { time: "17:00–18:00", title: "Klinik case + savol-javob" },
        ],
      },
    ],
    pastGallery: [{ image: "/images/seminar-implant-tojgacha-poster.webp", caption: "Seminar posteri", subtitle: "Ikki kunlik seminar", still: true }],
    featured: true,
  },
];
