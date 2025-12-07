"use client";

import { Suspense } from "react";
import PerformanceCoach from "@/components/ai/PerformanceCoach";
import ChatBot from "@/components/ChatBot";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import NewsletterModal from "@/components/NewsletterModal";
import { TopLoader } from "@/components/ui/toploader";
import { ScrollRestoration } from "@/components/layout/ScrollRestoration";

export default function AppShellClient() {
  return (
    <>
      <Suspense fallback={null}>
        <ScrollRestoration />
      </Suspense>
      <TopLoader />
      <Header />
      <ChatBot />
      <NewsletterModal />
      <PerformanceCoach />
      <Footer />
    </>
  );
}
