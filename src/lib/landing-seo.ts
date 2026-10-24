import type { Metadata } from "next";

const title = "StomaHub — stomatologlar uchun platforma";
const description =
  "O‘zbekiston stomatologlari uchun platforma: klinika CRM, seminarlar, marketplace va ta’lim. Bepul ro‘yxatdan o‘ting yoki CRM demo oling.";

export const landingMetadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/" },
  openGraph: {
    title,
    description,
    siteName: "StomaHub",
    locale: "uz_UZ",
    type: "website",
    url: "/",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: title }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og.png"],
  },
};
