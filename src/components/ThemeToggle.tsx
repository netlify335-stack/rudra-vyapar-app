"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white dark:bg-slate-900 p-5 shadow-sm opacity-50">
        <div className="h-6 w-6 rounded-full bg-slate-200 animate-pulse"></div>
        <h4 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">Theme</h4>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">Loading...</p>
      </div>
    );
  }

  const isDark = theme === "dark";

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {isDark ? <Moon size={20} /> : <Sun size={20} />}
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Theme Preference</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400">Switch to {isDark ? "Light" : "Dark"} mode</p>
          </div>
        </div>
        
        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isDark ? 'bg-indigo-500' : 'bg-slate-300'}`}
        >
          <span className="sr-only">Toggle dark mode</span>
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDark ? 'translate-x-6' : 'translate-x-1'}`}
          />
        </button>
      </div>
    </div>
  );
}
