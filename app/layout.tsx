import "./globals.css";

import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";

import AIChatbot from "@/components/AIChatbot";
import { NewsletterModal } from "@/components/NewsletterModal";
import QueryProvider from "@/components/QueryProvider";
import { UTMTracker } from "@/components/UTMTracker";
import { Toaster } from "@/components/ui/toaster";

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
      <head>
        <link rel="preload" as="image" href="/images/hero-illustration.png" />
        {process.env.NEXT_PUBLIC_GA_ID ? (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
            />
            <script
              id="ga-init"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', { send_page_view: true });
                `,
              }}
            />
          </>
        ) : null}
        {process.env.NEXT_PUBLIC_FACEBOOK_PIXEL ? (
          <>
            <script
              id="fb-pixel"
              dangerouslySetInnerHTML={{
                __html: `
                  !function(f,b,e,v,n,t,s)
                  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                  n.queue=[];t=b.createElement(e);t.async=!0;
                  t.src=v;s=b.getElementsByTagName(e)[0];
                  s.parentNode.insertBefore(t,s)}(window, document,'script',
                  'https://connect.facebook.net/en_US/fbevents.js');
                  fbq('init', '${process.env.NEXT_PUBLIC_FACEBOOK_PIXEL}');
                  fbq('track', 'PageView');
                `,
              }}
            />
            <noscript>
              <iframe
                title="fb-pixel"
                height="0"
                width="0"
                style={{ display: "none", visibility: "hidden" }}
                src={`https://www.facebook.com/tr?id=${process.env.NEXT_PUBLIC_FACEBOOK_PIXEL}&ev=PageView&noscript=1`}
              />
            </noscript>
          </>
        ) : null}
      </head>
      <body className={`${inter.variable} ${poppins.variable}`}>
        <QueryProvider>
          <UTMTracker />
          <main className="min-h-screen w-full bg-cream">{children}</main>
          <AIChatbot />
          <NewsletterModal />
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
