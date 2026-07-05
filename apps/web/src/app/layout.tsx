import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });

export const viewport: Viewport = {
  width: "device-width", initialScale: 1, maximumScale: 5, themeColor: "#0F172A",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://sarkaritrack.in"),
  title: { default: "SarkariTrack — Sarkari Job Alerts 2025", template: "%s | SarkariTrack" },
  description: "India's fastest government job portal. Instant alerts for SSC, UPSC, Railway, Bank, State PSC.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "SarkariTrack" },
  formatDetection: { telephone: false },
  icons: {
    icon:    [{ url: "/icons/icon-192.png", sizes: "192x192" }],
    apple:   [{ url: "/icons/icon-152.png", sizes: "152x152" }],
    shortcut: "/icons/icon-192.png",
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <meta name="application-name" content="SarkariTrack" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="bg-[#F7F8FC] text-gray-900 antialiased">
        <Header />
        <div className="pb-16 md:pb-0">{children}</div>
        <Footer />
        <MobileBottomNav />
      </body>
    </html>
  );
}
