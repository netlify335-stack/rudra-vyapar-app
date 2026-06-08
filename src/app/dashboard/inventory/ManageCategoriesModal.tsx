"use client";
import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";

export function ManageCategoriesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [categories, setCategories] = useState<any[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) fetchCategories();
  }, [open]);

  async function fetchCategories() {
    const res = await fetch("/api/categories");
    if (res.ok) setCategories(await res.json());
  }

  async function add() {
    if (!newName) return;
    setLoading(true);
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    setLoading(false);
    if (res.ok) {
      setNewName("");
      fetchCategories();
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this category?")) return;
    const res = await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
    if (res.ok) fetchCategories();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between border-b pb-3">
          <h3 className="text-lg font-bold text-slate-900">Manage Categories</h3>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">✕</button>
        </div>

        <div className="mb-4 flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New category name"
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-orange-400"
          />
          <button 
            onClick={add} 
            disabled={loading || !newName}
            className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-50"
          >
            Add
          </button>
        </div>

        <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50 p-2">
          {categories.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-500">No categories added yet.</div>
          ) : (
            categories.map(c => (
              <div key={c.id} className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm mb-2 border border-slate-100">
                <span className="text-sm font-medium text-slate-800">{c.name}</span>
                <button onClick={() => remove(c.id)} className="text-rose-500 hover:text-rose-700">
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
