import { NextResponse } from "next/server";
import { db } from "@/db";
import { licenses } from "@/db/neonSchema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { licenseKey, deviceId } = await req.json();

    if (!licenseKey) {
      return NextResponse.json({ valid: false, reason: "No license key provided" }, { status: 400 });
    }

    const licenseData = await db.select().from(licenses).where(eq(licenses.key, licenseKey)).limit(1);

    if (licenseData.length === 0) {
      return NextResponse.json({ valid: false, reason: "Invalid license key" });
    }

    const license = licenseData[0];

    if (license.isRevoked) {
      return NextResponse.json({ valid: false, reason: "License has been revoked" });
    }
    
    if (license.isPaused) {
      return NextResponse.json({ valid: false, reason: "License is temporarily paused" });
    }

    if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
      return NextResponse.json({ valid: false, reason: "License has expired" });
    }

    // Basic device binding (simplified for array)
    const devices = (license.deviceIds as string[]) || [];
    if (devices.length > 0 && !devices.includes(deviceId)) {
      if (devices.length >= (license.maxDevices || 1)) {
        return NextResponse.json({ valid: false, reason: "License device limit reached" });
      }
      // Bind new device
      await db.update(licenses).set({ deviceIds: [...devices, deviceId] }).where(eq(licenses.key, licenseKey));
    } else if (devices.length === 0 && deviceId) {
      await db.update(licenses).set({ deviceIds: [deviceId] }).where(eq(licenses.key, licenseKey));
    }

    return NextResponse.json({ 
      valid: true, 
      expiryDate: license.expiresAt,
      status: license.isRevoked ? "revoked" : "active",
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("License validation error:", error);
    // Return 503 so frontend handles grace period
    return NextResponse.json({ valid: false, reason: "Server error" }, { status: 503 });
  }
}
