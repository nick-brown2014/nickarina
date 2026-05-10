import type { Metadata } from "next";
import { Geist, Geist_Mono, Cinzel } from "next/font/google";
import "./globals.css";
import Image from "next/image";
import Navigation from "@/app/components/Navigation";
import PageFader from "@/app/components/PageFader";
import moon from "@/app/assets/moon.png";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Nick & Karina | October 31, 2026",
  description: "Join us for the wedding celebration of Nick and Karina at Della Terra Mountain Chateau in Estes Park, Colorado",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cinzel.variable} antialiased`}
      >
        <div className="fixed inset-0 -z-10 bg-black flex items-center justify-center pointer-events-none">
          <Image
            src={moon}
            alt=""
            priority
            className="w-[60vmin] h-[60vmin] object-contain opacity-90"
          />
        </div>
        <Navigation />
        <PageFader>{children}</PageFader>
      </body>
    </html>
  );
}
