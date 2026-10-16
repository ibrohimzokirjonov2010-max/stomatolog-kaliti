import { getDesktopSeminar } from "@/data/desktop-seminars";
import type { SeminarTicket } from "@/lib/seminar-tickets";

export type CertType = "seminar" | "onlayn" | "vebinar" | "amaliy";
export type CertTheme = "blue" | "mint" | "sand" | "navy" | "sky" | "royal";

export type Certificate = {
  id: string;
  title: string;
  type: CertType;
  typeLabel: string;
  teacher: string;
  date: string;
  dateLabel: string;
  place: string;
  cme: number;
  holder: string;
  theme: CertTheme;
  earned?: boolean;
};

export const certTypes: { id: CertType | "cme"; label: string }[] = [
  { id: "seminar", label: "Seminarlar" },
  { id: "onlayn", label: "Onlayn darslar" },
  { id: "vebinar", label: "Vebinarlar" },
  { id: "amaliy", label: "Amaliy treninglar" },
  { id: "cme", label: "CME ballari" },
];

export const designCertificates: Certificate[] = [
  {
    id: "cert-implant",
    title: "Zamonaviy implantologiya",
    type: "seminar",
    typeLabel: "Seminar",
    teacher: "Dr. Sardor Karimov",
    date: "2026-11-24",
    dateLabel: "24-noyabr 2026",
    place: "Toshkent",
    cme: 16,
    holder: "Ibrohim Karimov",
    theme: "blue",
  },
  {
    id: "cert-endo",
    title: "Endodontiya: kanal davolash asoslari",
    type: "onlayn",
    typeLabel: "Onlayn kurs",
    teacher: "Dr. Nigora Aliyeva",
    date: "2026-10-12",
    dateLabel: "12-oktabr 2026",
    place: "Onlayn",
    cme: 12,
    holder: "Ibrohim Karimov",
    theme: "mint",
  },
  {
    id: "cert-orto",
    title: "Ortodontiya: zamonaviy yondashuvlar",
    type: "seminar",
    typeLabel: "Seminar",
    teacher: "Dr. Azizbek Mirzayev",
    date: "2026-08-05",
    dateLabel: "5-avgust 2026",
    place: "Samarqand",
    cme: 10,
    holder: "Ibrohim Karimov",
    theme: "sand",
  },
  {
    id: "cert-cad",
    title: "Raqamli stomatologiya: skanerlar va CAD/CAM",
    type: "vebinar",
    typeLabel: "Vebinar",
    teacher: "Dr. Bobur Tursunov",
    date: "2026-06-20",
    dateLabel: "20-iyun 2026",
    place: "Onlayn",
    cme: 8,
    holder: "Ibrohim Karimov",
    theme: "navy",
  },
  {
    id: "cert-paro",
    title: "Klinik parodontologiya",
    type: "amaliy",
    typeLabel: "Amaliy trening",
    teacher: "Dr. Malika Yo‘ldosheva",
    date: "2026-05-15",
    dateLabel: "15-may 2026",
    place: "Toshkent",
    cme: 10,
    holder: "Ibrohim Karimov",
    theme: "sky",
  },
  {
    id: "cert-child",
    title: "Bolalar stomatologiyasi",
    type: "onlayn",
    typeLabel: "Onlayn kurs",
    teacher: "Dr. Dilnoza Saidova",
    date: "2026-04-10",
    dateLabel: "10-aprel 2026",
    place: "Onlayn",
    cme: 6,
    holder: "Ibrohim Karimov",
    theme: "royal",
  },
];

const themes: CertTheme[] = ["blue", "mint", "sand", "navy", "sky", "royal"];

export function certificatesFromTickets(tickets: SeminarTicket[]): Certificate[] {
  return tickets.map((ticket, index) => {
    const seminar = getDesktopSeminar(ticket.seminarId);
    return {
      id: `ticket-${ticket.id}`,
      title: ticket.title,
      type: "seminar" as const,
      typeLabel: "Seminar",
      teacher: seminar?.speaker ?? "StomaHub",
      date: ticket.createdAt.slice(0, 10),
      dateLabel: ticket.when,
      place: ticket.place,
      cme: seminar?.cme ?? 8,
      holder: ticket.name,
      theme: themes[index % themes.length],
      earned: true,
    };
  });
}
