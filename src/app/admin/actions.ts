"use server";

import { db } from "@/db";
import { licenses, auditLogs } from "@/db/neonSchema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";

// Ensure this is securely checked against the logged-in user in production
const ADMIN_EMAIL = process.env.ADMIN_EMAILS?.split(",")[0] || "admin@example.com";

export async function generateLicense(formData: FormData) {
  const type = formData.get("type") as string;
  const value = parseInt(formData.get("value") as string, 10);
  const name = formData.get("name") as string || "Unknown User";
  
  let expiryDate = null;
  
  if (type === "days") {
    expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + value);
  } else if (type === "months") {
    expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + value);
  }
  // Infinity means expiryDate remains null

  const licenseKey = `BILL-${uuidv4().substring(0, 8).toUpperCase()}-${uuidv4().substring(0, 4).toUpperCase()}`;

  await db.insert(licenses).values({
    licenseKey,
    userEmail: name, // Using userEmail field to store the intended name for now
    status: "active",
    expiryDate: expiryDate ? expiryDate.toISOString().split('T')[0] : null,
  });

  await db.insert(auditLogs).values({
    adminEmail: ADMIN_EMAIL,
    action: "key_generated",
    licenseKey,
    details: { type, value, name },
  });

  revalidatePath("/admin");
}

export async function revokeLicense(licenseKey: string) {
  await db.update(licenses).set({ status: "revoked" }).where(eq(licenses.licenseKey, licenseKey));
  
  await db.insert(auditLogs).values({
    adminEmail: ADMIN_EMAIL,
    action: "key_revoked",
    licenseKey,
    details: {},
  });

  revalidatePath("/admin");
}
