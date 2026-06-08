import { db } from "@/db";
import { products, parties, batches } from "@/db/schema";
import { and, eq, lte } from "drizzle-orm";
import { getActiveStoreId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
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

    // Generate Hinglish Markdown
    let md = `Namaste! 🙏 Yahan aapke business ka aaj ka haal hai:\n\n`;

    // Stock Status
    md += `### 📉 Low Stock Alert\n`;
    if (actualLowStock.length > 0) {
      md += `Dhyan dein, in items ka stock khatam hone wala hai ya ho gaya hai:\n`;
      actualLowStock.slice(0, 10).forEach(p => {
        md += `- **${p.name}**: Sirf ${p.currentStock} bache hain! (Minimum: ${p.minStockLevel})\n`;
      });
      if (actualLowStock.length > 10) md += `- *...aur ${actualLowStock.length - 10} items.*\n`;
      md += `> **Advice:** Inhe jaldi order kar lein taaki sales miss na ho!\n\n`;
    } else {
      md += `Sabhi items ka stock badhiya hai! Koi low stock nahi hai. 🎉\n\n`;
    }

    // Len Den Status
    md += `### 📒 Udhaari (Len-Den)\n`;
    if (lenaHai.length === 0 && denaHai.length === 0) {
      md += `Bahut badhiya! Market mein aapka koi udhaar ya baaki nahi hai.\n\n`;
    } else {
      if (lenaHai.length > 0) {
        md += `**Aapko Market se Lena hai (Receivables):**\n`;
        lenaHai.slice(0, 5).forEach(l => md += `- ${l}\n`);
        if (lenaHai.length > 5) md += `- *...aur ${lenaHai.length - 5} log.*\n`;
      }
      if (denaHai.length > 0) {
        md += `\n**Aapko Market mein Dena hai (Payables):**\n`;
        denaHai.slice(0, 5).forEach(d => md += `- ${d}\n`);
        if (denaHai.length > 5) md += `- *...aur ${denaHai.length - 5} log.*\n`;
      }
      md += `> **Advice:** Jisse paise lene hain unhe jaldi Khata se WhatsApp reminder bhej dein!\n\n`;
    }

    // Expiry Status
    md += `### ⏰ Expiring Batches\n`;
    if (expiring.length > 0) {
      md += `Kuch medicines aane wale 2 mahine mein expire hone wali hain:\n`;
      expiring.slice(0, 5).forEach(e => {
        md += `- Batch **${e.batchNo}**: Expiring on ${e.expiry} (Qty: ${e.qty})\n`;
      });
      if (expiring.length > 5) md += `- *...aur ${expiring.length - 5} batches.*\n`;
      md += `> **Advice:** In medicines ko jaldi nikalne ki koshish karein!\n\n`;
    } else {
      md += `Abhi koi batch jaldi expire nahi ho raha hai. 👍\n\n`;
    }

    // Advice
    md += `### 💡 Business Tip\n`;
    md += `Apne regular customers ko discount dekar unhe khush rakhein, aur daily ka hisaab verify karein. Badhiya kaam chal raha hai! 🚀`;

    return Response.json({ ok: true, insights: md });
  } catch(e) {
    console.error(e);
    return Response.json({ ok: false, error: "Failed to generate insights" });
  }
}
