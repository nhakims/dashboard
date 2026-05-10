import type { Metadata } from "next";
import {
  Montserrat,
  Noto_Naskh_Arabic,
  Inter,
  Roboto,
  Poppins,
  Raleway,
  Nunito,
  Playfair_Display,
  Lato,
  Oswald,
  DM_Sans,
} from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

const notoNaskhArabic = Noto_Naskh_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

export const metadata: Metadata = {
  title: "Dashboard — Hakim Samah",
  description: "A personal dashboard featuring a live clock, prayer times, daily Quran verse, weather, Quran streaming, and more.",
  keywords: ["dashboard", "prayer times", "quran", "clock", "weather", "hijri date", "islamic"],
  authors: [{ name: "Hakim Samah", url: "https://hakim.my" }],
  creator: "Hakim Samah",
  metadataBase: new URL("https://hakim.my"),
  openGraph: {
    title: "Dashboard — Hakim Samah",
    description: "A personal dashboard featuring a live clock, prayer times, daily Quran verse, weather, Quran streaming, and more.",
    url: "https://hakim.my",
    siteName: "Dashboard",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Dashboard — Hakim Samah",
    description: "A personal dashboard featuring a live clock, prayer times, daily Quran verse, weather, Quran streaming, and more.",
    creator: "@nurhakimsamah",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={[
        montserrat.variable,
        notoNaskhArabic.variable,
        inter.variable,
        roboto.variable,
        poppins.variable,
        raleway.variable,
        nunito.variable,
        playfairDisplay.variable,
        lato.variable,
        oswald.variable,
        dmSans.variable,
        "h-full antialiased",
      ].join(" ")}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
