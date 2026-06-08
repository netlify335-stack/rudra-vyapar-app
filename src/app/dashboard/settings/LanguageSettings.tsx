"use client";

import { useState, useEffect } from "react";
import { Languages } from "lucide-react";

const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिंदी (Hindi)" },
  { code: "bn", label: "বাংলা (Bengali)" },
  { code: "or", label: "ଓଡ଼ିଆ (Odia)" },
  { code: "gu", label: "ગુજરાતી (Gujarati)" },
  { code: "ta", label: "தமிழ் (Tamil)" },
  { code: "te", label: "తెలుగు (Telugu)" },
  { code: "ml", label: "മലയാളം (Malayalam)" },
  { code: "kn", label: "ಕನ್ನಡ (Kannada)" },
];

export function LanguageSettings() {
  const [currentLang, setCurrentLang] = useState("en");

  useEffect(() => {
    // Read the googtrans cookie to find the current language
    const match = document.cookie.match(/googtrans=\/en\/([a-z]{2})/i);
    if (match && match[1]) {
      setCurrentLang(match[1]);
    }
  }, []);

  const changeLanguage = (langCode: string) => {
    // Clear cookies for all possible domain variations
    const domains = [location.hostname, "." + location.hostname, ""];
    domains.forEach(d => {
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;${d ? ` domain=${d};` : ""}`;
    });

    if (langCode !== "en") {
      // Set the Google Translate cookie
      domains.forEach(d => {
        document.cookie = `googtrans=/en/${langCode}; path=/;${d ? ` domain=${d};` : ""}`;
      });
    }
    
    // Reload to apply the translation
    window.location.reload();
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
          <Languages size={20} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-900">App Language</h4>
          <p className="text-xs text-slate-500">Translate the entire UI</p>
        </div>
      </div>
      
      <div className="mt-5">
        <select
          value={currentLang}
          onChange={(e) => changeLanguage(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition-colors focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500"
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>
      <p className="mt-3 text-[10px] text-slate-400">
        Powered by Google Translate. Page will reload on change.
      </p>
    </div>
  );
}
