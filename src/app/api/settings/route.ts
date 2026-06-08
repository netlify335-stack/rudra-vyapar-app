import { db } from "@/db";
import { stores } from "@/db/schema";
import { getActiveStoreId } from "@/lib/session";
import { eq } from "drizzle-orm";
import { categories } from "@/db/schema";

export async function PUT(req: Request) {
  const storeId = await getActiveStoreId();
  if (!storeId) return Response.json({ ok: false, error: "No store" }, { status: 400 });

  const body = await req.json();

  await db
    .update(stores)
    .set({
      name: body.name,
      type: body.type,
      phone: body.phone,
      email: body.email,
      address: body.address,
      state: body.state,
      stateCode: body.stateCode,
      pincode: body.pincode,
      gstin: body.gstin,
      pan: body.pan,
      fssaiNo: body.fssaiNo,
      drugLicenseNo: body.drugLicenseNo,
      upiId: body.upiId,
      bankName: body.bankName,
      bankAccountNo: body.bankAccountNo,
      bankIfsc: body.bankIfsc,
      invoicePrefix: body.invoicePrefix,
      businessType: body.businessType,
    })
    .where(eq(stores.id, storeId));

  // Seed categories if businessType is provided
  if (body.businessType) {
    const existingCats = await db.select().from(categories).where(eq(categories.storeId, storeId));
    
    // Only seed if they have less than 3 categories to avoid spamming
    if (existingCats.length < 3) {
      let defaults: string[] = [];
      switch (body.businessType) {
        case "grocery": defaults = ["Rice & Grains", "Pulses", "Spices", "Snacks", "Beverages", "Personal Care"]; break;
        case "pharmacy": defaults = ["Tablets", "Syrups", "Injections", "Ointments", "Drops", "Surgicals"]; break;
        case "clothing": defaults = ["Men's Wear", "Women's Wear", "Kids", "Winter Wear", "Accessories"]; break;
        case "hardware": defaults = ["Tools", "Paints", "Plumbing", "Electricals", "Building Materials"]; break;
        case "electronics": defaults = ["Mobiles", "Laptops", "Accessories", "Home Appliances"]; break;
        case "general": defaults = ["General", "Stationery", "Gifts", "Cosmetics"]; break;
      }
      
      const toInsert = defaults.filter(d => !existingCats.some(e => e.name === d));
      if (toInsert.length > 0) {
        await db.insert(categories).values(
          toInsert.map(name => ({ storeId, name }))
        );
      }
    }
  }

  return Response.json({ ok: true });
}
