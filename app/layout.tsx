import type { Metadata } from "next";
import { Special_Elite } from "next/font/google";
import "./globals.css";
import Image from "next/image";
import Navigation from "@/app/components/Navigation";
import PageFader from "@/app/components/PageFader";
import moon from "@/app/assets/moon.png";

const specialElite = Special_Elite({
  variable: "--font-special-elite",
  subsets: ["latin"],
  weight: "400",
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
        className={`${specialElite.variable} antialiased`}
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
