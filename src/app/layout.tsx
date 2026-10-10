import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import { CartProvider } from "@/components/cart-provider";
import { FavoritesProvider } from "@/components/favorites-provider";
import { SeminarRegsProvider } from "@/components/seminar-provider";
import { UstaWorkProvider } from "@/components/usta-provider";
import { JobsWorkProvider } from "@/components/jobs-provider";
import { CommunityWorkProvider } from "@/components/community-provider";
import { LabWorkProvider } from "@/components/lab-provider";
import { SurplusWorkProvider } from "@/components/surplus-provider";
import { SellerWorkProvider } from "@/components/seller-provider";
import { DoctorProfileProvider } from "@/components/doctor-profile-provider";
import { AppChrome } from "@/components/dashboard/app-chrome";
import { PwaInstall } from "@/components/pwa-install";
import { site } from "@/data/site";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://stomatolog-kaliti-deploy-eta.vercel.app"),
  title: {
    default: `${site.name} — stomatologlar platformasi`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
  applicationName: site.name,
  appleWebApp: {
    capable: true,
    title: site.name,
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
  other: { "mobile-web-app-capable": "yes" },
  openGraph: {
    title: `${site.name} — stomatologlar platformasi`,
    description: site.description,
    siteName: site.name,
    locale: "uz_UZ",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: site.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — stomatologlar platformasi`,
    description: site.description,
    images: ["/og.png"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0066FF",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="uz"
      className={`${outfit.variable} ${plusJakarta.variable} h-full antialiased`}
    >
      <body className="h-full overflow-hidden bg-background text-foreground">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2"
        >
          Asosiy qismga o‘tish
        </a>
        <DoctorProfileProvider>
          <CartProvider>
            <FavoritesProvider>
              <SeminarRegsProvider>
                <UstaWorkProvider>
                  <JobsWorkProvider>
                    <CommunityWorkProvider>
                      <LabWorkProvider>
                        <SurplusWorkProvider>
                          <SellerWorkProvider>
                            <AppChrome>{children}</AppChrome>
                          </SellerWorkProvider>
                        </SurplusWorkProvider>
                      </LabWorkProvider>
                    </CommunityWorkProvider>
                  </JobsWorkProvider>
                </UstaWorkProvider>
              </SeminarRegsProvider>
            </FavoritesProvider>
          </CartProvider>
        </DoctorProfileProvider>
        <PwaInstall />
      </body>
    </html>
  );
}
