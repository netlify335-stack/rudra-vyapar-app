"use client";
import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";

import { getLocalDb } from "@/db/local";
import { storeExtras as schemaExtras } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export function ManageExtrasModal({ open, storeId, onClose }: { open: boolean; storeId: string; onClose: () => void }) {
  const [extras, setExtras] = useState<any[]>([]);
  const [type, setType] = useState<"color"|"size"|"material">("color");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) fetchExtras();
  }, [open, storeId]);

  async function fetchExtras() {
    const db = await getLocalDb();
    const res = await db.select().from(schemaExtras).where(eq(schemaExtras.storeId, storeId));
    setExtras(res.filter(e => e.type === type));
  }

  useEffect(() => {
    fetchExtras();
  }, [type]);

  async function add() {
    if (!name) return;
    setLoading(true);
    try {
      const db = await getLocalDb();
      await db.insert(schemaExtras).values({ storeId, type, name });
      setName("");
      fetchExtras();
    } catch(e) {
      console.error(e);
      alert("Failed to add extra");
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this variant option?")) return;
    try {
      const db = await getLocalDb();
      await db.delete(schemaExtras).where(and(eq(schemaExtras.id, id), eq(schemaExtras.storeId, storeId)));
      fetchExtras();
    } catch(e) {
      console.error(e);
      alert("Failed to delete extra");
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between border-b pb-3">
          <h3 className="text-lg font-bold text-slate-900">Manage Extras</h3>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">✕</button>
        </div>

        <div className="mb-4 flex gap-2 border-b border-slate-100 pb-4">
          <button onClick={() => setType("color")} className={`flex-1 rounded-lg py-1 text-sm font-semibold transition ${type === "color" ? "bg-orange-100 text-orange-700" : "text-slate-500 hover:bg-slate-100"}`}>Colors</button>
          <button onClick={() => setType("size")} className={`flex-1 rounded-lg py-1 text-sm font-semibold transition ${type === "size" ? "bg-orange-100 text-orange-700" : "text-slate-500 hover:bg-slate-100"}`}>Sizes</button>
          <button onClick={() => setType("material")} className={`flex-1 rounded-lg py-1 text-sm font-semibold transition ${type === "material" ? "bg-orange-100 text-orange-700" : "text-slate-500 hover:bg-slate-100"}`}>Materials</button>
        </div>

        <div className="mb-4 flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={`New ${type} name`}
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-orange-400"
          />
          <button 
            onClick={add} 
            disabled={loading || !name}
            className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-50"
          >
            Add
          </button>
        </div>

        <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50 p-2">
          {extras.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-500">No {type}s added yet.</div>
          ) : (
            extras.map(e => (
              <div key={e.id} className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm mb-2 border border-slate-100">
                <span className="text-sm font-medium text-slate-800">{e.name}</span>
                <button onClick={() => remove(e.id)} className="text-rose-500 hover:text-rose-700">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
