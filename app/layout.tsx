import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";

import Header from "@/components/Header";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Parent Helper",
  description: "Discover baby and toddler activities across the United Kingdom with Parent Helper.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${poppins.variable} bg-brand-cream text-brand-teal antialiased`}
      >
        <Header />
        <main className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 pb-16 pt-28 sm:px-8">
          {children}
        </main>
      </body>
    </html>
  );
}
