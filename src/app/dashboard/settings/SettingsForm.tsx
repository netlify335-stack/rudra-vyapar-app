"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SettingsForm({ store }: { store: any }) {
  const router = useRouter();
  const [formData, setFormData] = useState(store);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage("");
    try {
      const { getLocalDb } = await import("@/db/local");
      const { stores } = await import("@/db/schema");
      const { eq } = await import("drizzle-orm");
      const db = await getLocalDb();

      await db.update(stores).set(formData).where(eq(stores.id, store.id));
      setMessage("Settings saved successfully!");
      router.refresh();
    } catch (err: any) {
      setMessage("Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const sections = [
    {
      title: "Store profile",
      fields: [
        { name: "name", label: "Name", type: "text" },
        { name: "type", label: "Store Category", type: "text" },
        { 
          name: "businessType", 
          label: "Business Type (Changes default categories)", 
          type: "select",
          options: [
            { value: "", label: "Select Business Type" },
            { value: "grocery", label: "Grocery / Supermarket" },
            { value: "pharmacy", label: "Pharmacy / Medical" },
            { value: "clothing", label: "Clothing / Fashion" },
            { value: "hardware", label: "Hardware / Tools" },
            { value: "electronics", label: "Electronics" },
            { value: "general", label: "General Store" }
          ]
        },
        { name: "phone", label: "Phone", type: "text" },
        { name: "email", label: "Email", type: "text" },
        { name: "address", label: "Address", type: "text" },
        { name: "state", label: "State", type: "text" },
        { name: "stateCode", label: "State Code", type: "text" },
        { name: "pincode", label: "Pincode", type: "text" },
      ],
    },
    {
      title: "Tax & compliance",
      fields: [
        { name: "gstin", label: "GSTIN", type: "text" },
        { name: "pan", label: "PAN", type: "text" },
        { name: "fssaiNo", label: "FSSAI License", type: "text" },
        { name: "drugLicenseNo", label: "Drug License", type: "text" },
      ],
    },
    {
      title: "Bank & payments",
      fields: [
        { name: "upiId", label: "UPI ID", type: "text" },
        { name: "bankName", label: "Bank Name", type: "text" },
        { name: "bankAccountNo", label: "Account No.", type: "text" },
        { name: "bankIfsc", label: "IFSC", type: "text" },
      ],
    },
    {
      title: "Billing",
      fields: [
        { name: "invoicePrefix", label: "Invoice Prefix", type: "text" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {sections.map((s) => (
          <div key={s.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-bold text-slate-900">{s.title}</h3>
            <div className="space-y-3">
              {s.fields.map((f) => (
                <div key={f.name}>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">{f.label}</label>
                  {f.type === "select" ? (
                    <select
                      name={f.name}
                      value={formData[f.name] || ""}
                      onChange={handleChange as any}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-orange-500 focus:outline-none bg-white"
                    >
                      {f.options?.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={f.type}
                      name={f.name}
                      value={formData[f.name] || ""}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-orange-500 focus:outline-none"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-xl bg-orange-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Settings"}
        </button>
        {message && <span className="text-sm font-medium text-emerald-600">{message}</span>}
      </div>
    </div>
  );
}
