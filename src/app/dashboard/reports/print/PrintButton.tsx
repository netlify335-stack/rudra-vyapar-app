"use client";

import { Printer } from "lucide-react";
import { useEffect } from "react";

export function PrintButton() {
  useEffect(() => {
    // Auto-trigger print dialog after 1 second
    const timer = setTimeout(() => {
      window.print();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <button 
      onClick={() => window.print()} 
      className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-bold text-white shadow hover:bg-blue-700"
    >
      <Printer size={18} />
      Print / Save as PDF
    </button>
  );
}
