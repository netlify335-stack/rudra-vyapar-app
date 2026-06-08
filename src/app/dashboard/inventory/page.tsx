import { db } from "@/db";
import { products, batches } from "@/db/schema";
import { and, asc, eq, gt, lte, sql } from "drizzle-orm";
import { getActiveStoreId } from "@/lib/session";
import { formatINR, formatNumber, formatDate } from "@/lib/format";
import { AddProductForm } from "./AddProductForm";
import { ProductList } from "./ProductList";
import { InventorySettingsButtons } from "./InventorySettingsButtons";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const storeId = (await getActiveStoreId())!;
  const list = await db
    .select()
    .from(products)
    .where(and(eq(products.storeId, storeId), eq(products.isActive, true)))
    .orderBy(asc(products.name));

  const totalSku = list.length;
  const stockValue = list.reduce((s, p) => s + Number(p.currentStock) * Number(p.purchasePrice), 0);
  const lowStock = list.filter((p) => Number(p.currentStock) <= Number(p.minStockLevel));

  const in90 = new Date(); in90.setDate(in90.getDate() + 90);
  const expiring = await db
    .select({
      id: batches.id,
      batchNo: batches.batchNo,
      expiryDate: batches.expiryDate,
      quantity: batches.quantity,
      productName: products.name,
    })
    .from(batches)
    .innerJoin(products, eq(products.id, batches.productId))
    .where(and(eq(batches.storeId, storeId), gt(batches.quantity, "0"), lte(batches.expiryDate, in90.toISOString().slice(0, 10))))
    .orderBy(asc(batches.expiryDate));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Inventory 📦</h1>
          <p className="text-sm text-slate-500">{totalSku} active SKUs · Stock value {formatINR(stockValue)}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card label="Total SKUs" value={String(totalSku)} icon="📦" tint="from-indigo-500 to-purple-600" />
        <Card label="Low Stock" value={String(lowStock.length)} icon="⚠" tint="from-rose-500 to-pink-600" />
        <Card label="Expiring (90d)" value={String(expiring.length)} icon="⏰" tint="from-amber-500 to-orange-600" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <AddProductForm />
        <InventorySettingsButtons />
      </div>

      {/* Low stock */}
      {lowStock.length > 0 && (
        <Section title="Low stock alerts" sub="Restock these items soon">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-2.5 text-left">Product</th>
                <th className="px-5 py-2.5 text-right">Current</th>
                <th className="px-5 py-2.5 text-right">Min</th>
                <th className="px-5 py-2.5 text-right">Reorder</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lowStock.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-5 py-2.5 font-medium text-slate-800">{p.name}</td>
                  <td className="px-5 py-2.5 text-right font-bold text-rose-600">{formatNumber(Number(p.currentStock), 1)} {p.unit}</td>
                  <td className="px-5 py-2.5 text-right text-slate-600">{formatNumber(Number(p.minStockLevel), 1)}</td>
                  <td className="px-5 py-2.5 text-right">
                    <button className="rounded-md bg-orange-100 px-2 py-1 text-[11px] font-semibold text-orange-700">Reorder</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}

      {/* Expiry */}
      {expiring.length > 0 && (
        <Section title="Expiring batches" sub="Within next 90 days · FIFO clearance recommended">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-2.5 text-left">Product</th>
                <th className="px-5 py-2.5 text-left">Batch</th>
                <th className="px-5 py-2.5 text-left">Expiry</th>
                <th className="px-5 py-2.5 text-right">Qty</th>
                <th className="px-5 py-2.5 text-right">Days left</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expiring.map((b) => {
                const days = Math.ceil((new Date(b.expiryDate).getTime() - Date.now()) / 86400000);
                return (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="px-5 py-2.5 font-medium text-slate-800">{b.productName}</td>
                    <td className="px-5 py-2.5 font-mono text-xs text-slate-600">{b.batchNo}</td>
                    <td className="px-5 py-2.5 text-slate-700">{formatDate(b.expiryDate)}</td>
                    <td className="px-5 py-2.5 text-right text-slate-700">{formatNumber(Number(b.quantity), 0)}</td>
                    <td className="px-5 py-2.5 text-right">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${days <= 30 ? "bg-rose-100 text-rose-700" : days <= 60 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                        {days}d
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Section>
      )}

      <Section title="All products">
        <ProductList initialList={list} />
      </Section>
    </div>
  );
}

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-4">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        {sub && <p className="text-[11px] text-slate-500">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

function Card({ label, value, icon, tint }: { label: string; value: string; icon: string; tint: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`mb-2 inline-grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${tint} text-lg text-white shadow-md`}>{icon}</div>
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-950">{value}</div>
    </div>
  );
}
