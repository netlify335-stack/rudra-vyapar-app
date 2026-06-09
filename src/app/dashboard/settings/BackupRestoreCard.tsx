"use client";

import { Download, Upload, Loader2, CloudUpload, CloudDownload } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { getLocalDb } from "@/db/local";
import { stores, parties, products, productVariants, batches, storeExtras, invoices, invoiceItems, expenses, khataEntries } from "@/db/schema";

declare global {
  interface Window {
    google: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            prompt?: string;
            callback: (response: { access_token: string; error?: string }) => void;
          }) => { requestAccessToken: () => void };
        };
      };
    };
  }
}

export function BackupRestoreCard() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [gapiLoaded, setGapiLoaded] = useState(false);

  useEffect(() => {
    // Load Google Identity Services script
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setGapiLoaded(true);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const getBackupData = async () => {
    const db = await getLocalDb();
    return {
      stores: await db.select().from(stores),
      parties: await db.select().from(parties),
      products: await db.select().from(products),
      productVariants: await db.select().from(productVariants),
      batches: await db.select().from(batches),
      storeExtras: await db.select().from(storeExtras),
      invoices: await db.select().from(invoices),
      invoiceItems: await db.select().from(invoiceItems),
      expenses: await db.select().from(expenses),
      khataEntries: await db.select().from(khataEntries),
      timestamp: new Date().toISOString()
    };
  };

  const handleLocalBackup = async () => {
    setLoading(true);
    setMsg("Preparing backup...");
    try {
      const backupData = await getBackupData();
      const blob = new Blob([JSON.stringify(backupData)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rudra_vyapar_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMsg("Local backup downloaded!");
      setTimeout(() => setMsg(""), 3000);
    } catch (e: any) {
      setMsg("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const requestDriveToken = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!window.google) return reject(new Error("Google API not loaded"));
      
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!clientId || clientId === "YOUR_CLIENT_ID_HERE") {
        return reject(new Error("Google Client ID not configured by Admin"));
      }

      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "https://www.googleapis.com/auth/drive.file",
        prompt: "select_account",
        callback: (response: any) => {
          if (response.error !== undefined) {
            reject(response);
          }
          resolve(response.access_token);
        },
      });
      client.requestAccessToken();
    });
  };

  const handleDriveBackup = async () => {
    setLoading(true);
    setMsg("Connecting to Google Drive...");
    try {
      const token = await requestDriveToken();
      setMsg("Uploading backup to Drive...");
      const backupData = await getBackupData();
      
      const fileContent = JSON.stringify(backupData);
      const file = new Blob([fileContent], { type: "application/json" });
      const metadata = {
        name: `rudra_vyapar_backup_${new Date().toISOString().slice(0, 10)}.json`,
        mimeType: "application/json",
      };

      const form = new FormData();
      form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
      form.append("file", file);

      const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      if (!res.ok) throw new Error("Upload failed: " + res.statusText);
      setMsg("Successfully backed up to Google Drive! ✅");
      setTimeout(() => setMsg(""), 4000);
    } catch (e: any) {
      setMsg("Drive Error: " + (e.message || "Authentication cancelled"));
    } finally {
      setLoading(false);
    }
  };

  const handleDriveRestore = async () => {
    setLoading(true);
    setMsg("Connecting to Google Drive...");
    try {
      const token = await requestDriveToken();
      setMsg("Searching for backup file...");
      
      // Find the file
      const searchRes = await fetch("https://www.googleapis.com/drive/v3/files?q=name contains 'rudra_vyapar_backup' and trashed=false&orderBy=createdTime desc&spaces=drive", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const searchData = await searchRes.json();
      if (!searchData.files || searchData.files.length === 0) {
        throw new Error("No backup file found in Google Drive");
      }
      
      const fileId = searchData.files[0].id;
      setMsg("Downloading backup data...");
      
      const fileRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dataStr = await fileRes.text();
      const parsedData = JSON.parse(dataStr);
      
      await restoreDataToDb(parsedData);
      
    } catch (e: any) {
      setMsg("Drive Error: " + (e.message || "Authentication cancelled"));
      setLoading(false);
    }
  };

  const handleLocalRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setMsg("Restoring data...");
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await restoreDataToDb(data);
    } catch (err: any) {
      setMsg("Restore failed: " + err.message);
      setLoading(false);
    } finally {
      e.target.value = "";
    }
  };

  const restoreDataToDb = async (data: any) => {
    if (!confirm("WARNING: This will overwrite ALL your current local data. Are you sure you want to restore?")) {
      setLoading(false);
      setMsg("");
      return;
    }

    const db = await getLocalDb();
    // Delete existing data
    await db.delete(khataEntries);
    await db.delete(expenses);
    await db.delete(invoiceItems);
    await db.delete(invoices);
    await db.delete(storeExtras);
    await db.delete(batches);
    await db.delete(productVariants);
    await db.delete(products);
    await db.delete(parties);
    await db.delete(stores);

    // Insert new data
    if (data.stores?.length) await db.insert(stores).values(data.stores);
    if (data.parties?.length) await db.insert(parties).values(data.parties);
    if (data.products?.length) await db.insert(products).values(data.products);
    if (data.productVariants?.length) await db.insert(productVariants).values(data.productVariants);
    if (data.batches?.length) await db.insert(batches).values(data.batches);
    if (data.storeExtras?.length) await db.insert(storeExtras).values(data.storeExtras);
    if (data.invoices?.length) await db.insert(invoices).values(data.invoices);
    if (data.invoiceItems?.length) await db.insert(invoiceItems).values(data.invoiceItems);
    if (data.expenses?.length) await db.insert(expenses).values(data.expenses);
    if (data.khataEntries?.length) await db.insert(khataEntries).values(data.khataEntries);

    setMsg("Restore complete! Reloading...");
    setTimeout(() => window.location.reload(), 1500);
  };

  return (
    <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 shadow-sm">
      <div className="text-3xl">☁️</div>
      <h4 className="mt-3 text-sm font-bold text-indigo-900">Database Backup</h4>
      <p className="mt-1 text-xs text-indigo-700">Export your offline database locally or to Google Drive.</p>
      
      {msg && <div className="mt-3 rounded-lg bg-indigo-100 p-2 text-xs font-bold text-indigo-800 text-center">{msg}</div>}

      {/* Google Drive Actions */}
      <div className="mt-4 flex gap-2">
        <button 
          onClick={handleDriveBackup} 
          disabled={loading || !gapiLoaded}
          className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <CloudUpload size={16} />} 
          Drive Backup
        </button>
        <button 
          onClick={handleDriveRestore}
          disabled={loading || !gapiLoaded}
          className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-blue-600 bg-white px-3 py-2.5 text-xs font-bold text-blue-700 hover:bg-blue-50 disabled:opacity-50"
        >
          <CloudDownload size={16} /> Drive Restore
        </button>
      </div>

      <div className="my-3 flex items-center gap-2">
        <div className="h-px flex-1 bg-indigo-200"></div>
        <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">OR LOCAL FILE</div>
        <div className="h-px flex-1 bg-indigo-200"></div>
      </div>

      {/* Local Actions */}
      <div className="flex gap-2">
        <button 
          onClick={handleLocalBackup} 
          disabled={loading}
          className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          <Download size={14} /> Local Backup
        </button>
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-indigo-600 bg-transparent px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
        >
          <Upload size={14} /> Local Restore
        </button>
      </div>
      <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleLocalRestore} />
    </div>
  );
}
