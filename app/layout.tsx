import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./premium-product.css";
import "./support-pages.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    "https://nexora-web-virid.vercel.app",
  ),
  title: "Nexora — Thoughtfully chosen",
  description:
    "A premium commerce experience for technology and lifestyle essentials.",
  openGraph: {
    title: "Nexora — Thoughtfully chosen",
    description:
      "Good things, thoughtfully chosen. Explore a calmer way to shop.",
    type: "website",
    images: [
      {
        url: "/og-product.jpg",
        width: 1536,
        height: 1024,
        alt: "Nexora — Real products. Verified details.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nexora — Thoughtfully chosen",
    description: "Good things, thoughtfully chosen.",
    images: ["/og-product.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
