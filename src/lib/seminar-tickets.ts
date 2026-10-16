export type SeminarTicket = {
  id: string;
  seminarId: string;
  title: string;
  when: string;
  place: string;
  image: string;
  name: string;
  price: number;
  tier: "standart" | "vip";
  code: string;
  createdAt: string;
};

const KEY = "sk-seminar-tickets-v1";

let raw = "";
let cache: SeminarTicket[] = [];

export function loadSeminarTickets(): SeminarTicket[] {
  if (typeof window === "undefined") return cache;
  const next = window.localStorage.getItem(KEY) ?? "";
  if (next === raw) return cache;
  raw = next;
  try {
    const parsed = JSON.parse(next) as SeminarTicket[];
    cache = Array.isArray(parsed) ? parsed : [];
  } catch {
    cache = [];
  }
  return cache;
}

export function rememberSeminarTicket(ticket: SeminarTicket) {
  const next = [ticket, ...loadSeminarTickets().filter((item) => item.id !== ticket.id)];
  raw = JSON.stringify(next);
  cache = next;
  window.localStorage.setItem(KEY, raw);
  window.dispatchEvent(new Event("sk-seminar-tickets"));
}
