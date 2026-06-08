import { db } from "@/db";
import { stores } from "@/db/schema";
import { getActiveStoreId } from "@/lib/session";
import { eq } from "drizzle-orm";

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
    })
    .where(eq(stores.id, storeId));

  return Response.json({ ok: true });
}
