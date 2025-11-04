import "./globals.css";

import localFont from "next/font/local";
import type { Metadata } from "next";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ChatBot from "@/components/ChatBot";

const inter = localFont({
  variable: "--font-inter",
  display: "swap",
  src: [
    {
      path: "../public/fonts/inter/inter-regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/inter/inter-bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
});

const poppins = localFont({
  variable: "--font-poppins",
  display: "swap",
  src: [
    {
      path: "../public/fonts/poppins/poppins-regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/poppins/poppins-semibold.woff2",
      weight: "600",
      style: "normal",
    },
  ],
});

export const metadata: Metadata = {
  title: "Parent Helper",
  description:
    "Discover curated baby and toddler activities across the United Kingdom with Parent Helper.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${poppins.variable} scroll-smooth`}
    >
      <body className="min-h-screen bg-cream text-charcoal antialiased">
        <div className="relative flex min-h-screen flex-col">
          <Header />
          <main className="relative flex-1 pt-24 md:pt-32">{children}</main>
          <Footer />
        </div>
        <ChatBot />
      </body>
    </html>
  );
}
