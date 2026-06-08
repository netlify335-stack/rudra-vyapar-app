"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LicenseSettingsCard({ license }: { license: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const currentVolume = license.deviceIds ? license.deviceIds.length : 0;

  const toggleHold = async () => {
    setLoading(true);
    await fetch("/api/auth/hold", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPaused: !license.isPaused })
    });
    setLoading(false);
    router.refresh();
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-3xl">👥</div>
      <h4 className="mt-3 text-sm font-bold text-slate-900">Staff & Roles (Volume)</h4>
      <p className="mt-1 text-xs text-slate-600">
        You are currently using <strong>{currentVolume}</strong> out of <strong>{license.maxDevices}</strong> allowed devices.
      </p>
      
      <button 
        onClick={toggleHold}
        disabled={loading}
        className={`mt-4 rounded-lg px-3 py-1.5 text-xs font-semibold ${
          license.isPaused 
            ? "bg-emerald-500 text-white hover:bg-emerald-600" 
            : "bg-amber-500 text-white hover:bg-amber-600"
        } disabled:opacity-50`}
      >
        {loading ? "Please wait..." : license.isPaused ? "Continue All Keys" : "Hold All Keys"}
      </button>
    </div>
  );
}
