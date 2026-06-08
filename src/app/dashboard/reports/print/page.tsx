import { requireStore } from "@/lib/session";
import { db } from "@/db";
import { products, khataEntries, parties, expenses } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { PrintButton } from "./PrintButton";

export const dynamic = "force-dynamic";

export default async function PrintReportPage({ searchParams }: { searchParams: { type: string } }) {
  const store = await requireStore();
  const type = searchParams.type || 'inventory';

  let title = "Report";
  let content = null;

  if (type === 'inventory') {
    title = "Inventory Report";
    const data = await db.select().from(products).where(eq(products.storeId, store.id)).orderBy(products.name);
    content = (
      <table className="w-full text-left text-sm border-collapse border border-slate-300">
        <thead>
          <tr className="bg-slate-100">
            <th className="border border-slate-300 px-3 py-2">Item Name</th>
            <th className="border border-slate-300 px-3 py-2">Stock</th>
            <th className="border border-slate-300 px-3 py-2">MRP</th>
            <th className="border border-slate-300 px-3 py-2">Selling Price</th>
          </tr>
        </thead>
        <tbody>
          {data.map(p => (
            <tr key={p.id}>
              <td className="border border-slate-300 px-3 py-2">{p.name}</td>
              <td className="border border-slate-300 px-3 py-2">{p.currentStock}</td>
              <td className="border border-slate-300 px-3 py-2">₹{p.mrp}</td>
              <td className="border border-slate-300 px-3 py-2">₹{p.sellingPrice}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  } else if (type === 'khata') {
    title = "Khata (Ledger) Report";
    const data = await db.select().from(khataEntries).where(eq(khataEntries.storeId, store.id)).orderBy(desc(khataEntries.entryDate));
    content = (
      <table className="w-full text-left text-sm border-collapse border border-slate-300">
        <thead>
          <tr className="bg-slate-100">
            <th className="border border-slate-300 px-3 py-2">Date</th>
            <th className="border border-slate-300 px-3 py-2">Party ID</th>
            <th className="border border-slate-300 px-3 py-2">Type</th>
            <th className="border border-slate-300 px-3 py-2">Amount</th>
            <th className="border border-slate-300 px-3 py-2">Notes</th>
          </tr>
        </thead>
        <tbody>
          {data.map(k => (
            <tr key={k.id}>
              <td className="border border-slate-300 px-3 py-2">{k.entryDate}</td>
              <td className="border border-slate-300 px-3 py-2">{k.partyId}</td>
              <td className="border border-slate-300 px-3 py-2 capitalize">{k.type}</td>
              <td className="border border-slate-300 px-3 py-2">₹{k.amount}</td>
              <td className="border border-slate-300 px-3 py-2">{k.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  } else if (type === 'parties') {
    title = "Parties Report";
    const data = await db.select().from(parties).where(eq(parties.storeId, store.id)).orderBy(parties.name);
    content = (
      <table className="w-full text-left text-sm border-collapse border border-slate-300">
        <thead>
          <tr className="bg-slate-100">
            <th className="border border-slate-300 px-3 py-2">Name</th>
            <th className="border border-slate-300 px-3 py-2">Phone</th>
            <th className="border border-slate-300 px-3 py-2">Balance</th>
          </tr>
        </thead>
        <tbody>
          {data.map(p => {
            const balance = parseFloat(p.outstandingBalance || "0");
            const balanceType = balance > 0 ? "Receivable" : balance < 0 ? "Payable" : "Settled";
            return (
              <tr key={p.id}>
                <td className="border border-slate-300 px-3 py-2">{p.name}</td>
                <td className="border border-slate-300 px-3 py-2">{p.phone}</td>
                <td className="border border-slate-300 px-3 py-2 font-bold">{balanceType} ₹{Math.abs(balance)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  } else if (type === 'gst') {
    title = "GST Filing Export";
    content = <p className="text-sm">GST detailed view requires full invoice processing. This is a placeholder report.</p>;
  }

  return (
    <div className="bg-white min-h-screen text-black p-8">
      <div className="print:hidden mb-6">
        <PrintButton />
      </div>
      
      <div className="mb-8 border-b-2 border-black pb-4">
        <h1 className="text-3xl font-bold uppercase">{title}</h1>
        <h2 className="text-xl mt-1">{store.name}</h2>
        <p className="text-sm">Generated on: {new Date().toLocaleString()}</p>
      </div>

      <div>
        {content}
      </div>
    </div>
  );
}
