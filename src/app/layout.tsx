import type { Metadata } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "VyaparOne — Indian Kirana, Pharmacy & Business Manager",
  description:
    "GST billing, digital khata, inventory & pharmacy expiry tracking for Indian shopkeepers. एक ही जगह सब कुछ.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased transition-colors duration-300 ease-in-out bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <ThemeProvider>
          {children}
        {/* Hidden Google Translate element - used by the script for page translation */}
        <div id="google_translate_element" style={{ display: 'none' }}></div>
        <Script
          strategy="beforeInteractive"
          src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        />
        <Script id="google-translate-init" strategy="afterInteractive">
          {`
            function googleTranslateElementInit() {
              new window.google.translate.TranslateElement({
                pageLanguage: 'en',
                includedLanguages: 'en,hi,bn,or,gu,ta,te,ml,kn',
                layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
                autoDisplay: false
              }, 'google_translate_element');
            }
          `}
        </Script>
        {/* Custom CSS to hide Google Translate top banner completely */}
        <style dangerouslySetInnerHTML={{__html: `
          .goog-te-banner-frame { display: none !important; }
          body { top: 0 !important; }
          #goog-gt-tt { display: none !important; }
        `}} />
        </ThemeProvider>
      </body>
    </html>
  );
}
