import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://nexora-commerce.pages.dev"),
  title: "Nexora — Thoughtfully chosen",
  description: "A premium commerce experience for technology and lifestyle essentials.",
  openGraph: {
    title: "Nexora — Thoughtfully chosen",
    description: "Good things, thoughtfully chosen. Explore a calmer way to shop.",
    type: "website",
    images: [{ url: "/og.png", width: 1536, height: 1024, alt: "Nexora — Good things, thoughtfully chosen" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nexora — Thoughtfully chosen",
    description: "Good things, thoughtfully chosen.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body></html>;
}
