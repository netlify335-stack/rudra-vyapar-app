import { db } from "@/db";
import { invoices, invoiceItems, parties, products, stores, khataEntries } from "@/db/schema";
import { getActiveStoreId } from "@/lib/session";
import { calcInvoiceTotals, round2 } from "@/lib/gst";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

interface ItemBody {
  productId: string;
  variantId?: string | null;
  name: string;
  variantName?: string | null;
  hsnCode?: string | null;
  unit?: string;
  rate: number;
  quantity: number;
  discountPercent?: number;
  gstRate: number;
}

export async function POST(req: Request) {
  try {
    const storeId = await getActiveStoreId();
    if (!storeId) return Response.json({ ok: false, error: "No active store" }, { status: 400 });
    const body = (await req.json()) as {
      type?: "sale" | "purchase";
      partyId?: string | null;
      partyName?: string;
      partyPhone?: string;
      partyGstin?: string;
      partyAddress?: string;
      paymentMode?: "cash" | "upi" | "card" | "credit" | "bank" | "partial";
      splitPaymentMode1?: string;
      splitAmount1?: number;
      splitPaymentMode2?: string;
      splitAmount2?: number;
      notes?: string;
      items: ItemBody[];
    };

    if (!body.items?.length) return Response.json({ ok: false, error: "No items" }, { status: 400 });

    const type = body.type ?? "sale";
    const totals = calcInvoiceTotals({
      items: body.items.map((it) => ({
        rate: it.rate,
        quantity: it.quantity,
        discountPercent: it.discountPercent ?? 0,
        gstRate: it.gstRate,
      })),
      isIgst: false,
    });

    // Generate invoice number
    const [store] = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);
    const next = (store?.invoiceCounter ?? 1);
    const prefix = store?.invoicePrefix ?? "INV";
    const invoiceNo = `${prefix}-${String(next).padStart(5, "0")}`;
    await db.execute(sql`UPDATE stores SET invoice_counter = invoice_counter + 1 WHERE id = ${storeId}`);

    const paymentMode = body.paymentMode ?? "cash";
    let paid = 0;
    let balance = 0;
    let creditAmount = 0;

    if (paymentMode === "credit") {
      paid = 0;
      balance = totals.totalAmount;
      creditAmount = totals.totalAmount;
    } else if (paymentMode === "partial") {
      const sM1 = body.splitPaymentMode1;
      const sA1 = body.splitAmount1 || 0;
      const sM2 = body.splitPaymentMode2;
      const sA2 = body.splitAmount2 || 0;

      if (sM1 === "credit") creditAmount += sA1;
      else paid += sA1;

      if (sM2 === "credit") creditAmount += sA2;
      else paid += sA2;

      balance = creditAmount;
    } else {
      paid = totals.totalAmount;
      balance = 0;
    }

    paid = round2(paid);
    balance = round2(balance);

    const [inv] = await db
      .insert(invoices)
      .values({
        storeId,
        invoiceNo,
        type,
        status: "confirmed",
        partyId: body.partyId ?? null,
        partyName: body.partyName ?? "Walk-in Customer",
        partyPhone: body.partyPhone,
        partyGstin: body.partyGstin,
        partyAddress: body.partyAddress,
        invoiceDate: new Date().toISOString().slice(0, 10),
        isIgst: false,
        subtotal: String(totals.subtotal),
        discountAmount: String(totals.discountAmount),
        taxableAmount: String(totals.taxableAmount),
        cgstAmount: String(totals.cgstAmount),
        sgstAmount: String(totals.sgstAmount),
        igstAmount: String(totals.igstAmount),
        totalAmount: String(totals.totalAmount),
        paidAmount: String(paid),
        balanceDue: String(balance),
        paymentMode,
        splitPaymentMode1: body.splitPaymentMode1 ?? null,
        splitAmount1: body.splitAmount1 !== undefined ? String(body.splitAmount1) : null,
        splitPaymentMode2: body.splitPaymentMode2 ?? null,
        splitAmount2: body.splitAmount2 !== undefined ? String(body.splitAmount2) : null,
        notes: body.notes,
      })
      .returning();

    // Insert items + update stock
    for (const it of body.items) {
      const gross = it.rate * it.quantity;
      const disc = (gross * (it.discountPercent ?? 0)) / 100;
      const tx = gross - disc;
      const tax = (tx * it.gstRate) / 100;
      await db.insert(invoiceItems).values({
        invoiceId: inv.id,
        productId: it.productId,
        variantId: it.variantId ?? null,
        productName: it.name,
        variantName: it.variantName ?? null,
        hsnCode: it.hsnCode ?? null,
        quantity: String(it.quantity),
        unit: it.unit ?? "PCS",
        rate: String(it.rate),
        discountPercent: String(it.discountPercent ?? 0),
        taxableAmount: String(round2(tx)),
        gstRate: String(it.gstRate),
        taxAmount: String(round2(tax)),
        totalAmount: String(round2(tx + tax)),
      });
      
      // Decrement stock for sales, increment for purchase
      if (type === "sale") {
        if (it.variantId) {
          await db
            .update(productVariants)
            .set({ currentStock: sql`${productVariants.currentStock} - ${it.quantity}` })
            .where(eq(productVariants.id, it.variantId));
        } else {
          await db
            .update(products)
            .set({ currentStock: sql`${products.currentStock} - ${it.quantity}` })
            .where(eq(products.id, it.productId));
        }

        // FEFO Logic for Batches
        // Find batches with quantity > 0, ordered by expiryDate ASC
        const availableBatches = await db.select()
          .from(batches)
          .where(and(
            eq(batches.productId, it.productId),
            sql`${batches.quantity} > 0`
          ))
          .orderBy(batches.expiryDate);

        let remainingToDeduct = it.quantity;
        for (const b of availableBatches) {
          if (remainingToDeduct <= 0) break;
          const bQty = Number(b.quantity);
          const deductAmount = Math.min(bQty, remainingToDeduct);
          
          await db.update(batches)
            .set({ quantity: String(bQty - deductAmount) })
            .where(eq(batches.id, b.id));
            
          remainingToDeduct -= deductAmount;
        }

      } else {
        if (it.variantId) {
          await db
            .update(productVariants)
            .set({ currentStock: sql`${productVariants.currentStock} + ${it.quantity}` })
            .where(eq(productVariants.id, it.variantId));
        } else {
          await db
            .update(products)
            .set({ currentStock: sql`${products.currentStock} + ${it.quantity}` })
            .where(eq(products.id, it.productId));
        }
      }
    }

    // Khata + party balance update on credit
    if (creditAmount > 0 && body.partyId) {
      const isSale = type === "sale";
      const paymentNoteStr = paymentMode === "partial" ? " (Partial Udhaar)" : "";
      
      await db.insert(khataEntries).values({
        storeId,
        partyId: body.partyId,
        type: isSale ? "credit" : "credit", // For both, we are recording credit given/taken
        amount: String(creditAmount),
        notes: isSale ? `Goods sold — ${invoiceNo}${paymentNoteStr}` : `Goods purchased — ${invoiceNo}${paymentNoteStr}`,
        entryDate: new Date().toISOString().slice(0, 10),
        invoiceId: inv.id,
      });

      if (isSale) {
        // Customer owes us money (outstandingBalance increases positively)
        await db
          .update(parties)
          .set({ outstandingBalance: sql`${parties.outstandingBalance} + ${creditAmount}` })
          .where(eq(parties.id, body.partyId));
      } else {
        // We owe Supplier money (outstandingBalance decreases negatively)
        await db
          .update(parties)
          .set({ outstandingBalance: sql`${parties.outstandingBalance} - ${creditAmount}` })
          .where(eq(parties.id, body.partyId));
      }
    }

    return Response.json({ ok: true, invoiceId: inv.id, invoiceNo });
  } catch (err) {
    console.error(err);
    return Response.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
