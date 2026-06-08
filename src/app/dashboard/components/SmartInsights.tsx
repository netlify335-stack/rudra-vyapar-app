"use client";

import { useState } from "react";
import { Sparkles, RefreshCw, AlertTriangle, ChevronRight } from "lucide-react";

export function SmartInsights() {
  const [insights, setInsights] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generateInsights = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai-insights", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate insights");
      setInsights(data.insights);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 shadow-sm">
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-purple-200/40 blur-3xl" />
      
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">Rudra AI Smart Insights</h2>
          </div>
          <p className="mt-1 max-w-lg text-sm text-slate-600">
            AI will analyze your current inventory, low stock, and expiring batches to give you actionable business advice.
          </p>
        </div>
        
        <button
          onClick={generateInsights}
          disabled={loading}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-70"
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {insights ? "Refresh AI Insights" : "Generate AI Insights"}
        </button>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 border border-rose-100">
          <AlertTriangle className="h-4 w-4" />
          <p>{error}</p>
        </div>
      )}

      {loading && !insights && (
        <div className="mt-6 space-y-3">
          <div className="h-16 w-full animate-pulse rounded-xl bg-indigo-100/50" />
          <div className="h-16 w-full animate-pulse rounded-xl bg-purple-100/50" />
        </div>
      )}

      {insights && !loading && (
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {insights.map((insight, idx) => (
            <div 
              key={idx} 
              className="flex items-start gap-3 rounded-xl border border-white/60 bg-white/60 p-4 shadow-sm backdrop-blur-md"
            >
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                {idx + 1}
              </div>
              <p className="text-sm font-medium leading-relaxed text-slate-800">
                {insight}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
