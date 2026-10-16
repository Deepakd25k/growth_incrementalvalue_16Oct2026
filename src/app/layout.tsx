import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { site } from "@/config/site";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono-face", display: "swap", weight: ["500", "600", "700"] });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: "D2C Growth Audit by Deepak Gupta | Find where your money is leaking",
  description:
    "A 60-minute live audit of your Shopify D2C brand: Meta & Google ads, attribution, CRO, RTO, AOV and unit economics. Written report in 48 hours and 15 days of support.",
  openGraph: {
    title: "D2C Growth Audit by Deepak Gupta",
    description: "Ads, attribution, CRO, RTO and unit economics, audited live. Report in 48 hours.",
    type: "website",
    images: ["/deepak.jpg"],
  },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#ffffff" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
