"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, ShieldAlert, Loader2, Upload, FileJson } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [licenseKey, setLicenseKey] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Show error if redirected due to license revocation
    const params = new URLSearchParams(window.location.search);
    const urlError = params.get("error");
    if (urlError === "license_inactive") {
      setError("Your license has been revoked or expired. Please enter a new license key.");
    }

    // Generate or get device ID from localStorage
    let storedDeviceId = localStorage.getItem("vyapar_device_id");
    if (!storedDeviceId) {
      storedDeviceId = crypto.randomUUID();
      localStorage.setItem("vyapar_device_id", storedDeviceId);
    }
    setDeviceId(storedDeviceId);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseKey.trim()) {
      setError("Please enter a valid license key");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseKey, deviceId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to authenticate");
      }

      // Success! Redirect to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-orange-600">
            <KeyRound size={32} />
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-slate-900">Activate Device</h2>
          <p className="mt-2 text-sm text-slate-600">
            Enter your license key to unlock Rudra Vyapar on this device.
          </p>
        </div>

        <form onSubmit={handleLogin} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="license" className="block text-sm font-medium text-slate-700">
                License Key
              </label>
              <input
                id="license"
                type="text"
                required
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                className="mt-2 block w-full rounded-xl border border-slate-300 px-4 py-3 placeholder-slate-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 sm:text-sm"
                placeholder="RUDRA-XXXX-YYYY-ZZZZ"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-600">
              <ShieldAlert size={16} />
              <p>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-70"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : "Unlock Dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
}
