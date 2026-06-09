// @ts-nocheck
import { db } from "@/db";
import {
  stores,
  parties,
  products,
  batches,
  invoices,
  invoiceItems,
  khataEntries,
  expenses,
} from "@/db/schema";
import { users } from "@/db/neonSchema";
import { sql } from "drizzle-orm";
import { calcInvoiceTotals, round2 } from "@/lib/gst";

export const dynamic = "force-dynamic";

function daysFromNow(d: number): string {
  const dt = new Date();
  dt.setDate(dt.getDate() + d);
  return dt.toISOString().slice(0, 10);
}

export async function POST() {
  return runSeed();
}

export async function GET() {
  return runSeed();
}

async function runSeed() {
  // Idempotent: if data already exists, return success.
  let existing;
  try {
    existing = await db.select({ id: stores.id }).from(stores).limit(1);
  } catch (err: any) {
    console.error("DB QUERY ERROR FULL:", err);
    return Response.json({ ok: false, error: err.message, stack: err.stack, cause: err.cause }, { status: 500 });
  }
  if (existing && existing[0]) {
    return Response.json({ ok: true, storeId: existing[0].id, seeded: false });
  }

  // 1. Demo owner
  const [owner] = await db
    .insert(users)
    .values({ name: "Ramesh Kumar", phone: "+919876543210", email: "ramesh@vyapar.demo" })
    .returning();

  // 2. Store
  const [store] = await db
    .insert(stores)
    .values({
      ownerId: owner.id,
      name: "Sharma Kirana & General Store",
      type: "kirana",
      gstin: "27ABCDE1234F1Z5",
      pan: "ABCDE1234F",
      fssaiNo: "12345678901234",
      drugLicenseNo: "MH-PUN-2024-001",
      address: "Shop No. 12, Laxmi Market, FC Road",
      state: "Maharashtra",
      stateCode: "27",
      pincode: "411005",
      phone: "+919876543210",
      email: "store@sharmakirana.in",
      upiId: "sharmakirana@okhdfc",
      bankName: "HDFC Bank",
      bankAccountNo: "50100123456789",
      bankIfsc: "HDFC0001234",
    })
    .returning();

  // 3. Parties — customers & suppliers
  const partyRows = await db
    .insert(parties)
    .values([
      { storeId: store.id, type: "customer", name: "Suresh Patil", phone: "+919823456701", tag: "regular", city: "Pune", state: "Maharashtra", stateCode: "27", outstandingBalance: "4500" },
      { storeId: store.id, type: "customer", name: "Priya Deshmukh", phone: "+919823456702", tag: "vip", city: "Pune", state: "Maharashtra", stateCode: "27", outstandingBalance: "12800" },
      { storeId: store.id, type: "customer", name: "Anil Joshi", phone: "+919823456703", tag: "defaulter", city: "Pune", state: "Maharashtra", stateCode: "27", outstandingBalance: "23500" },
      { storeId: store.id, type: "customer", name: "Kavita More", phone: "+919823456704", tag: "regular", city: "Pune", state: "Maharashtra", stateCode: "27", outstandingBalance: "1200" },
      { storeId: store.id, type: "customer", name: "Rahul Khan", phone: "+919823456705", tag: "regular", city: "Pune", state: "Maharashtra", stateCode: "27", outstandingBalance: "0" },
      { storeId: store.id, type: "customer", name: "Meena Iyer", phone: "+919823456706", tag: "vip", city: "Pune", state: "Maharashtra", stateCode: "27", gstin: "27AAAPI1234B1Z9", outstandingBalance: "8400" },
      { storeId: store.id, type: "supplier", name: "Aashirvaad Distributors", phone: "+919811111111", gstin: "27ABCDF5678G1Z2", city: "Mumbai", state: "Maharashtra", stateCode: "27", outstandingBalance: "-31200" },
      { storeId: store.id, type: "supplier", name: "Amul Cooperative", phone: "+919822222222", gstin: "24AAACG1234B1Z1", city: "Anand", state: "Gujarat", stateCode: "24", outstandingBalance: "-8500" },
      { storeId: store.id, type: "supplier", name: "Dabur India Ltd", phone: "+919833333333", gstin: "07AAACD1234B1Z3", city: "Delhi", state: "Delhi", stateCode: "07", outstandingBalance: "0" },
    ])
    .returning();

  // 4. Products — mix of kirana + pharmacy
  const productRows = await db
    .insert(products)
    .values([
      { storeId: store.id, name: "Aashirvaad Atta 5kg", category: "Grocery", hsnCode: "1101", unit: "PKT", purchasePrice: "245", sellingPrice: "275", mrp: "285", gstRate: "5", minStockLevel: "10", currentStock: "42", manufacturer: "ITC Limited", barcode: "8901030865278" },
      { storeId: store.id, name: "Amul Butter 500g", category: "Dairy", hsnCode: "0405", unit: "PKT", purchasePrice: "245", sellingPrice: "265", mrp: "275", gstRate: "12", minStockLevel: "8", currentStock: "5", manufacturer: "Amul", barcode: "8901030123456" },
      { storeId: store.id, name: "Tata Salt 1kg", category: "Grocery", hsnCode: "2501", unit: "PKT", purchasePrice: "22", sellingPrice: "28", mrp: "30", gstRate: "5", minStockLevel: "20", currentStock: "120", manufacturer: "Tata Chemicals" },
      { storeId: store.id, name: "Fortune Sunflower Oil 1L", category: "Grocery", hsnCode: "1512", unit: "BTL", purchasePrice: "145", sellingPrice: "165", mrp: "175", gstRate: "5", minStockLevel: "12", currentStock: "28", manufacturer: "Adani Wilmar" },
      { storeId: store.id, name: "Maggi 2-Min Noodles 70g", category: "Snacks", hsnCode: "1902", unit: "PKT", purchasePrice: "11", sellingPrice: "14", mrp: "14", gstRate: "12", minStockLevel: "50", currentStock: "240", manufacturer: "Nestle India" },
      { storeId: store.id, name: "Parle-G Biscuits 250g", category: "Snacks", hsnCode: "1905", unit: "PKT", purchasePrice: "22", sellingPrice: "30", mrp: "30", gstRate: "18", minStockLevel: "30", currentStock: "85", manufacturer: "Parle Products" },
      { storeId: store.id, name: "Dettol Antiseptic 250ml", category: "Personal Care", hsnCode: "3808", unit: "BTL", purchasePrice: "115", sellingPrice: "140", mrp: "150", gstRate: "18", minStockLevel: "10", currentStock: "3", manufacturer: "Reckitt" },
      { storeId: store.id, name: "Surf Excel 1kg", category: "Household", hsnCode: "3402", unit: "PKT", purchasePrice: "145", sellingPrice: "175", mrp: "185", gstRate: "18", minStockLevel: "15", currentStock: "32", manufacturer: "HUL" },
      { storeId: store.id, name: "Colgate Toothpaste 200g", category: "Personal Care", hsnCode: "3306", unit: "TUB", purchasePrice: "85", sellingPrice: "105", mrp: "110", gstRate: "18", minStockLevel: "12", currentStock: "18", manufacturer: "Colgate-Palmolive" },
      { storeId: store.id, name: "Britannia Bread 400g", category: "Bakery", hsnCode: "1905", unit: "PKT", purchasePrice: "32", sellingPrice: "45", mrp: "50", gstRate: "5", minStockLevel: "10", currentStock: "14", manufacturer: "Britannia" },
      // Pharmacy items with expiry tracking
      { storeId: store.id, name: "Crocin Advance 500mg (15 tabs)", category: "Pharmacy", hsnCode: "3004", unit: "STR", purchasePrice: "28", sellingPrice: "32", mrp: "35", gstRate: "12", minStockLevel: "20", currentStock: "65", trackExpiry: true, manufacturer: "GSK Pharma", composition: "Paracetamol 500mg" },
      { storeId: store.id, name: "Azithromycin 500mg (5 tabs)", category: "Pharmacy", hsnCode: "3004", unit: "STR", purchasePrice: "55", sellingPrice: "72", mrp: "78", gstRate: "12", minStockLevel: "15", currentStock: "32", trackExpiry: true, isScheduleH: true, manufacturer: "Cipla", composition: "Azithromycin 500mg" },
      { storeId: store.id, name: "Metformin 500mg (10 tabs)", category: "Pharmacy", hsnCode: "3004", unit: "STR", purchasePrice: "22", sellingPrice: "28", mrp: "32", gstRate: "12", minStockLevel: "20", currentStock: "48", trackExpiry: true, isScheduleH: true, manufacturer: "Sun Pharma", composition: "Metformin HCl 500mg" },
      { storeId: store.id, name: "Dolo 650mg (15 tabs)", category: "Pharmacy", hsnCode: "3004", unit: "STR", purchasePrice: "26", sellingPrice: "31", mrp: "34", gstRate: "12", minStockLevel: "25", currentStock: "9", trackExpiry: true, manufacturer: "Micro Labs", composition: "Paracetamol 650mg" },
    ])
    .returning();

  // 5. Batches for pharmacy products (some expiring soon)
  const pharmaProducts = productRows.filter((p) => p.trackExpiry);
  if (pharmaProducts.length) {
    await db.insert(batches).values([
      { storeId: store.id, productId: pharmaProducts[0].id, batchNo: "CRO2024A", mfgDate: daysFromNow(-200), expiryDate: daysFromNow(22), quantity: "20", mrp: "35" },
      { storeId: store.id, productId: pharmaProducts[0].id, batchNo: "CRO2024B", mfgDate: daysFromNow(-90), expiryDate: daysFromNow(280), quantity: "45", mrp: "35" },
      { storeId: store.id, productId: pharmaProducts[1].id, batchNo: "AZI2024X", mfgDate: daysFromNow(-160), expiryDate: daysFromNow(58), quantity: "32", mrp: "78" },
      { storeId: store.id, productId: pharmaProducts[2].id, batchNo: "MET2024C", mfgDate: daysFromNow(-100), expiryDate: daysFromNow(85), quantity: "48", mrp: "32" },
      { storeId: store.id, productId: pharmaProducts[3].id, batchNo: "DOL2024K", mfgDate: daysFromNow(-300), expiryDate: daysFromNow(12), quantity: "9", mrp: "34" },
    ]);
  }

  // 6. Create some sample invoices over past 30 days
  type SampleInv = {
    daysAgo: number;
    partyIdx: number | null;
    paymentMode: string;
    items: { idx: number; qty: number; discount?: number }[];
    paid?: boolean;
  };
  const samples: SampleInv[] = [
    { daysAgo: 0, partyIdx: 0, paymentMode: "cash", items: [{ idx: 0, qty: 1 }, { idx: 2, qty: 2 }], paid: true },
    { daysAgo: 0, partyIdx: null, paymentMode: "upi", items: [{ idx: 4, qty: 5 }, { idx: 5, qty: 2 }], paid: true },
    { daysAgo: 0, partyIdx: 1, paymentMode: "credit", items: [{ idx: 3, qty: 1 }, { idx: 7, qty: 1 }], paid: false },
    { daysAgo: 1, partyIdx: null, paymentMode: "cash", items: [{ idx: 4, qty: 3 }, { idx: 8, qty: 1 }], paid: true },
    { daysAgo: 1, partyIdx: 2, paymentMode: "credit", items: [{ idx: 0, qty: 2 }, { idx: 3, qty: 2 }], paid: false },
    { daysAgo: 2, partyIdx: null, paymentMode: "upi", items: [{ idx: 5, qty: 4 }, { idx: 9, qty: 2 }], paid: true },
    { daysAgo: 3, partyIdx: 5, paymentMode: "cash", items: [{ idx: 10, qty: 3 }, { idx: 12, qty: 2 }], paid: true },
    { daysAgo: 5, partyIdx: null, paymentMode: "cash", items: [{ idx: 2, qty: 4 }, { idx: 6, qty: 1 }], paid: true },
    { daysAgo: 7, partyIdx: 1, paymentMode: "credit", items: [{ idx: 1, qty: 2 }, { idx: 11, qty: 1 }], paid: false },
    { daysAgo: 10, partyIdx: null, paymentMode: "upi", items: [{ idx: 4, qty: 10 }], paid: true },
    { daysAgo: 14, partyIdx: 0, paymentMode: "cash", items: [{ idx: 0, qty: 1 }, { idx: 7, qty: 1 }], paid: true },
    { daysAgo: 18, partyIdx: null, paymentMode: "cash", items: [{ idx: 5, qty: 6 }, { idx: 3, qty: 1 }], paid: true },
    { daysAgo: 22, partyIdx: 5, paymentMode: "credit", items: [{ idx: 8, qty: 2 }, { idx: 9, qty: 3 }], paid: false },
    { daysAgo: 26, partyIdx: null, paymentMode: "upi", items: [{ idx: 2, qty: 5 }, { idx: 4, qty: 8 }], paid: true },
  ];

  let counter = store.invoiceCounter;
  for (const s of samples) {
    const items = s.items.map((it) => {
      const p = productRows[it.idx];
      return {
        productId: p.id,
        productName: p.name,
        hsnCode: p.hsnCode,
        quantity: it.qty,
        unit: p.unit,
        rate: Number(p.sellingPrice),
        discountPercent: it.discount ?? 0,
        gstRate: Number(p.gstRate),
      };
    });
    const totals = calcInvoiceTotals({
      items: items.map((it) => ({ rate: it.rate, quantity: it.quantity, discountPercent: it.discountPercent, gstRate: it.gstRate })),
      isIgst: false,
    });
    const party = s.partyIdx !== null ? partyRows[s.partyIdx] : null;
    const paid = s.paid ? totals.totalAmount : 0;
    const balance = round2(totals.totalAmount - paid);
    const [inv] = await db
      .insert(invoices)
      .values({
        storeId: store.id,
        invoiceNo: `INV-${String(counter).padStart(5, "0")}`,
        type: "sale",
        status: "confirmed",
        partyId: party?.id,
        partyName: party?.name ?? "Walk-in Customer",
        partyPhone: party?.phone,
        partyGstin: party?.gstin,
        invoiceDate: daysFromNow(-s.daysAgo),
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
        paymentMode: s.paymentMode,
      })
      .returning();
    counter += 1;

    await db.insert(invoiceItems).values(
      items.map((it) => {
        const gross = it.rate * it.quantity;
        const disc = (gross * it.discountPercent) / 100;
        const tx = gross - disc;
        const tax = (tx * it.gstRate) / 100;
        return {
          invoiceId: inv.id,
          productId: it.productId,
          productName: it.productName,
          hsnCode: it.hsnCode,
          quantity: String(it.quantity),
          unit: it.unit,
          rate: String(it.rate),
          discountPercent: String(it.discountPercent),
          taxableAmount: String(round2(tx)),
          gstRate: String(it.gstRate),
          taxAmount: String(round2(tax)),
          totalAmount: String(round2(tx + tax)),
        };
      }),
    );

    // Add khata entry if credit
    if (s.paymentMode === "credit" && party) {
      await db.insert(khataEntries).values({
        storeId: store.id,
        partyId: party.id,
        type: "credit",
        amount: String(totals.totalAmount),
        notes: `Goods sold — Invoice ${inv.invoiceNo}`,
        entryDate: daysFromNow(-s.daysAgo),
        invoiceId: inv.id,
      });
    }
  }

  // bump store counter
  await db.execute(sql`UPDATE stores SET invoice_counter = ${counter} WHERE id = ${store.id}`);

  // 7. A few expenses
  await db.insert(expenses).values([
    { storeId: store.id, category: "Rent", description: "Shop rent for the month", amount: "15000", paymentMode: "bank", expenseDate: daysFromNow(-5) },
    { storeId: store.id, category: "Electricity", description: "MSEB bill", amount: "3200", paymentMode: "upi", expenseDate: daysFromNow(-7) },
    { storeId: store.id, category: "Transport", description: "Tempo charges from APMC", amount: "850", paymentMode: "cash", expenseDate: daysFromNow(-2) },
    { storeId: store.id, category: "Staff Salary", description: "Helper salary - Mahesh", amount: "8000", paymentMode: "cash", expenseDate: daysFromNow(-3) },
  ]);

  return Response.json({ ok: true, storeId: store.id, seeded: true });
}
