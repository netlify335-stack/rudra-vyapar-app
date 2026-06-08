import { db } from "@/db";
import { invoices, invoiceItems, parties, products, stores, khataEntries, productVariants } from "@/db/schema";
import { getActiveStoreId } from "@/lib/session";
import { calcInvoiceTotals, round2 } from "@/lib/gst";
import { eq, sql, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const storeId = await getActiveStoreId();
    if (!storeId) return Response.json({ ok: false, error: "No active store" }, { status: 400 });
    
    const { id } = await params;
    const body = (await req.json()) as {
      returnItems: {
        invoiceItemId: string;
        productId: string;
        variantId: string | null;
        name: string;
        variantName: string | null;
        hsnCode: string | null;
        unit: string;
        rate: number;
        returnQty: number;
        discountPercent: number;
        gstRate: number;
      }[];
      refundMode: "cash" | "upi" | "credit";
      notes?: string;
    };

    if (!body.returnItems?.length) return Response.json({ ok: false, error: "No items to return" }, { status: 400 });

    // Fetch original invoice
    const [origInv] = await db.select().from(invoices).where(and(eq(invoices.id, id), eq(invoices.storeId, storeId))).limit(1);
    if (!origInv) return Response.json({ ok: false, error: "Invoice not found" }, { status: 404 });

    const totals = calcInvoiceTotals({
      items: body.returnItems.map((it) => ({
        rate: it.rate,
        quantity: it.returnQty,
        discountPercent: it.discountPercent ?? 0,
        gstRate: it.gstRate,
      })),
      isIgst: false,
    });

    // Generate Return Note number
    const [store] = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);
    const next = (store?.invoiceCounter ?? 1);
    const prefix = store?.invoicePrefix ?? "INV";
    const returnNo = `${prefix}-RTN-${String(next).padStart(5, "0")}`;
    await db.execute(sql`UPDATE stores SET invoice_counter = invoice_counter + 1 WHERE id = ${storeId}`);

    let refundAmount = 0;
    let creditAmount = 0;

    if (body.refundMode === "credit") {
      creditAmount = totals.totalAmount;
    } else {
      refundAmount = totals.totalAmount;
    }

    const [retInv] = await db
      .insert(invoices)
      .values({
        storeId,
        invoiceNo: returnNo,
        type: "return",
        status: "confirmed",
        partyId: origInv.partyId,
        partyName: origInv.partyName,
        partyPhone: origInv.partyPhone,
        partyGstin: origInv.partyGstin,
        partyAddress: origInv.partyAddress,
        invoiceDate: new Date().toISOString().slice(0, 10),
        isIgst: false,
        subtotal: String(totals.subtotal),
        discountAmount: String(totals.discountAmount),
        taxableAmount: String(totals.taxableAmount),
        cgstAmount: String(totals.cgstAmount),
        sgstAmount: String(totals.sgstAmount),
        igstAmount: String(totals.igstAmount),
        totalAmount: String(totals.totalAmount),
        paidAmount: String(refundAmount), // Treated as refund paid out
        balanceDue: "0",
        paymentMode: body.refundMode,
        notes: body.notes ? `Return against ${origInv.invoiceNo}: ${body.notes}` : `Return against ${origInv.invoiceNo}`,
      })
      .returning();

    // Insert items + update stock back
    for (const it of body.returnItems) {
      if (it.returnQty <= 0) continue;

      const gross = it.rate * it.returnQty;
      const disc = (gross * (it.discountPercent ?? 0)) / 100;
      const tx = gross - disc;
      const tax = (tx * it.gstRate) / 100;
      
      await db.insert(invoiceItems).values({
        invoiceId: retInv.id,
        productId: it.productId,
        variantId: it.variantId ?? null,
        productName: it.name,
        variantName: it.variantName ?? null,
        hsnCode: it.hsnCode ?? null,
        quantity: String(it.returnQty),
        unit: it.unit ?? "PCS",
        rate: String(it.rate),
        discountPercent: String(it.discountPercent ?? 0),
        taxableAmount: String(round2(tx)),
        gstRate: String(it.gstRate),
        taxAmount: String(round2(tax)),
        totalAmount: String(round2(tx + tax)),
      });
      
      // Reverse stock (increment if original was sale, decrement if original was purchase)
      // Wait, let's assume `origInv.type === "sale"`, we increment stock. If `origInv.type === "purchase"`, we decrement.
      if (origInv.type === "sale") {
        if (it.variantId) {
          await db.update(productVariants).set({ currentStock: sql`${productVariants.currentStock} + ${it.returnQty}` }).where(eq(productVariants.id, it.variantId));
        } else {
          await db.update(products).set({ currentStock: sql`${products.currentStock} + ${it.returnQty}` }).where(eq(products.id, it.productId));
        }
      } else if (origInv.type === "purchase") {
        if (it.variantId) {
          await db.update(productVariants).set({ currentStock: sql`${productVariants.currentStock} - ${it.returnQty}` }).where(eq(productVariants.id, it.variantId));
        } else {
          await db.update(products).set({ currentStock: sql`${products.currentStock} - ${it.returnQty}` }).where(eq(products.id, it.productId));
        }
      }
    }

    // Khata + party balance update for Return
    // If credit note:
    if (creditAmount > 0 && origInv.partyId) {
      if (origInv.type === "sale") {
        // Customer returned items and we give them credit (outstandingBalance decreases)
        await db.insert(khataEntries).values({
          storeId,
          partyId: origInv.partyId,
          type: "payment", // A credit note acts like a payment from customer
          amount: String(creditAmount),
          notes: `Sales Return Credit Note — ${returnNo}`,
          entryDate: new Date().toISOString().slice(0, 10),
          invoiceId: retInv.id,
        });

        await db.update(parties).set({ outstandingBalance: sql`${parties.outstandingBalance} - ${creditAmount}` }).where(eq(parties.id, origInv.partyId));
      } else if (origInv.type === "purchase") {
        // We returned items to supplier, our udhaari decreases (treated as payment given)
        await db.insert(khataEntries).values({
          storeId,
          partyId: origInv.partyId,
          type: "payment",
          amount: String(creditAmount),
          notes: `Purchase Return Debit Note — ${returnNo}`,
          entryDate: new Date().toISOString().slice(0, 10),
          invoiceId: retInv.id,
        });

        await db.update(parties).set({ outstandingBalance: sql`${parties.outstandingBalance} + ${creditAmount}` }).where(eq(parties.id, origInv.partyId));
      }
    }

    return Response.json({ ok: true, invoiceId: retInv.id, invoiceNo: returnNo });
  } catch (err) {
    console.error(err);
    return Response.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
