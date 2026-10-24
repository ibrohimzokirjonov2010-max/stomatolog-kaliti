/**
 * Single source for public landing contacts.
 *
 * TODO(owner): set `phone` to the real number, for example "+998 71 200 11 22".
 * `null` hides the phone on the landing page. Do not invent a number.
 *
 * TODO(owner): replace `address` (and `addressMapHref`) with the real street address.
 *
 * TODO(owner): set `instagramUrl` to the real profile, for example "https://instagram.com/handle".
 * `null` shows a non-linking "Tez orada" placeholder. Do not invent a handle.
 */
export const publicContact: {
  email: string;
  emailHref: string;
  telegramHandle: string;
  telegramUrl: string;
  phone: string | null;
  address: string;
  addressMapHref: string;
  instagramUrl: string | null;
} = {
  email: "info@stomahub.uz",
  emailHref: "mailto:info@stomahub.uz",
  telegramHandle: "@stomahubuz",
  telegramUrl: "https://t.me/stomahubuz",
  phone: null,
  address: "Toshkent, O‘zbekiston",
  addressMapHref: "https://maps.google.com/?q=Toshkent%2C%20O%27zbekiston",
  instagramUrl: null,
};
