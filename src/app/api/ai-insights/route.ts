import { db } from "@/db";
import { products, parties, batches } from "@/db/schema";
import { and, eq, lte } from "drizzle-orm";
import { getActiveStoreId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const storeId = await getActiveStoreId();
    if (!storeId) return Response.json({ ok: false, error: "No store" }, { status: 400 });

    // 1. Low stock
    const lowStockProds = await db
      .select()
      .from(products)
      .where(and(eq(products.storeId, storeId), eq(products.isActive, true)))
      .execute();
      
    const actualLowStock = lowStockProds.filter(p => Number(p.currentStock) <= Number(p.minStockLevel));

    // 2. Len-den (Parties)
    const allParties = await db.select().from(parties).where(eq(parties.storeId, storeId));
    let lenaHai: string[] = [];
    let denaHai: string[] = [];
    
    for (const p of allParties) {
      const bal = Number(p.outstandingBalance);
      if (bal > 0) {
        lenaHai.push(`${p.name} se ₹${bal} lena hai`);
      } else if (bal < 0) {
        denaHai.push(`${p.name} ko ₹${Math.abs(bal)} dena hai`);
      }
    }

    // 3. Expiring Batches
    const today = new Date();
    today.setMonth(today.getMonth() + 2); // next 2 months
    const dateStr = today.toISOString().split("T")[0];

    const expiring = await db
      .select({ 
         batchNo: batches.batchNo, 
         expiry: batches.expiryDate, 
         qty: batches.quantity 
      })
      .from(batches)
      .where(and(eq(batches.storeId, storeId), lte(batches.expiryDate, dateStr)))
      .execute();

    // Generate Hinglish array
    let insightsArr: string[] = [];

    // Stock Status
    if (actualLowStock.length > 0) {
      let lowMsg = `📉 Low Stock Alert: In items ka stock khatam hone wala hai - `;
      actualLowStock.slice(0, 5).forEach(p => {
        lowMsg += `${p.name} (Sirf ${p.currentStock} bache hain), `;
      });
      insightsArr.push(lowMsg.slice(0, -2) + `. Inhe jaldi order kar lein!`);
    } else {
      insightsArr.push(`📉 Stock Status: Sabhi items ka stock badhiya hai! Koi low stock nahi hai. 🎉`);
    }

    // Len Den Status
    if (lenaHai.length > 0 || denaHai.length > 0) {
      let lenDenMsg = `📒 Udhaari (Len-Den): `;
      if (lenaHai.length > 0) lenDenMsg += `Aapko market se ${lenaHai.length} logon ki udhaari wapas leni hai. `;
      if (denaHai.length > 0) lenDenMsg += `Aapko ${denaHai.length} logon ko paise dene hain. `;
      lenDenMsg += `Khata se WhatsApp pe reminder bhejna shuru karein!`;
      insightsArr.push(lenDenMsg);
    } else {
      insightsArr.push(`📒 Udhaari (Len-Den): Bahut badhiya! Market mein aapka koi udhaar ya baaki nahi hai.`);
    }

    // Expiry Status
    if (expiring.length > 0) {
      let expMsg = `⏰ Expiring Batches: Kuch items aane wale 2 mahine mein expire hone wali hain - `;
      expiring.slice(0, 3).forEach(e => {
        expMsg += `Batch ${e.batchNo} (${e.expiry}), `;
      });
      insightsArr.push(expMsg.slice(0, -2) + `. In items ko jaldi nikalne ki koshish karein!`);
    } else {
      insightsArr.push(`⏰ Expiring Batches: Abhi koi batch jaldi expire nahi ho raha hai. 👍`);
    }

    // Advice
    insightsArr.push(`💡 Business Tip: Apne regular customers ko discount dekar unhe khush rakhein, aur daily ka hisaab verify karein. Badhiya kaam chal raha hai! 🚀`);

    return Response.json({ ok: true, insights: insightsArr });
  } catch(e) {
    console.error(e);
    return Response.json({ ok: false, error: "Failed to generate insights" });
  }
}
