export type Partner = {
  id: string;
  name: string;
  supplies: string;
  delivery: string;
  contactLabel: string;
  contactHref: string;
  demo: true;
};

export const partners: Partner[] = [
  {
    id: "dentsupply",
    name: "DentSupply Toshkent",
    supplies: "Implantlar, burlar va kundalik sarf materiallari.",
    delivery: "Toshkent bo‘ylab 24 soat.",
    contactLabel: "Telegram",
    contactHref: "https://t.me/stomatologklub",
    demo: true,
  },
  {
    id: "medicapharm",
    name: "MedicaPharm",
    supplies: "Anesteziya, dezinfeksiya va klinika kimyosi.",
    delivery: "Toshkent 24–48 soat.",
    contactLabel: "Telefon",
    contactHref: "tel:+998712000000",
    demo: true,
  },
  {
    id: "ortholine",
    name: "OrthoLine",
    supplies: "Ortodontiya materiallari va yoylar.",
    delivery: "Toshkent 48 soat, viloyatlarga 3–5 kun.",
    contactLabel: "Telegram",
    contactHref: "https://t.me/stomatologklub",
    demo: true,
  },
];
