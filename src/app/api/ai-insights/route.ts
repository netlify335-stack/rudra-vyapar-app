import { NextResponse } from "next/server";
import { getActiveStoreId } from "@/lib/session";
import { db } from "@/db";
import { products, batches } from "@/db/schema";
import { and, eq, lte, gt, sql } from "drizzle-orm";

export const maxDuration = 30;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
const MODEL = "gemini-3.5-flash";
const FALLBACK_MODEL = "gemini-2.5-flash-lite";

export async function POST(req: Request) {
  try {
    const storeId = await getActiveStoreId();
    if (!storeId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch Low Stock Data
    const lowStock = await db
      .select({
        name: products.name,
        currentStock: products.currentStock,
        minStockLevel: products.minStockLevel,
        unit: products.unit,
      })
      .from(products)
      .where(and(eq(products.storeId, storeId), sql`${products.currentStock} <= ${products.minStockLevel}`))
      .limit(10);

    // 2. Fetch Expiring Soon Data (Next 60 days)
    const in60 = new Date();
    in60.setDate(in60.getDate() + 60);
    
    const expiring = await db
      .select({
        productName: products.name,
        batchNo: batches.batchNo,
        quantity: batches.quantity,
        expiryDate: batches.expiryDate,
      })
      .from(batches)
      .innerJoin(products, eq(products.id, batches.productId))
      .where(
        and(
          eq(batches.storeId, storeId),
          gt(batches.quantity, "0"),
          lte(batches.expiryDate, in60.toISOString().slice(0, 10))
        )
      )
      .orderBy(batches.expiryDate)
      .limit(10);

    // 3. Construct Prompt for Gemini
    if (lowStock.length === 0 && expiring.length === 0) {
      return NextResponse.json({
        insights: ["Stock bilkul sahi hai aur koi bhi dawai jaldi expire nahi ho rahi hai. Great job!"]
      });
    }

    const systemPrompt = `You are a smart business assistant for an Indian Kirana/Pharmacy store.
You will be provided with a list of low stock items and items expiring soon.
Generate 2 to 4 very short, highly actionable, and encouraging business recommendations in conversational Hinglish.
Example: "Dolo-650 ka stock khatam hone wala hai, aaj hi distributor se order le lo."
Example: "Amul Butter agle mahine expire hoga, ispe Buy 1 Get 1 lagakar nikal do."
Return ONLY a valid JSON array of strings containing the recommendations, without any markdown formatting or extra text.`;

    const userPrompt = `Low Stock Items:\n${JSON.stringify(lowStock, null, 2)}\n\nExpiring Soon:\n${JSON.stringify(expiring, null, 2)}`;

    // 4. Call Gemini API directly via REST to avoid SDK issues
    let response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: [
          { role: "user", parts: [{ text: userPrompt }] }
        ],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json"
        }
      })
    });

    if (response.status === 429) {
      console.warn("Primary model rate limited, falling back to gemini-2.5-flash-lite");
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${FALLBACK_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }]
          },
          contents: [
            { role: "user", parts: [{ text: userPrompt }] }
          ],
          generationConfig: {
            temperature: 0.7,
            responseMimeType: "application/json"
          }
        })
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error:", errorText);
      throw new Error(`AI API failed: ${response.status}`);
    }

    const data = await response.json();
    const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!aiText) {
      throw new Error("Empty response from AI");
    }

    let insights: string[] = [];
    try {
      insights = JSON.parse(aiText);
      if (!Array.isArray(insights)) {
        insights = [aiText];
      }
    } catch (e) {
      // Fallback if AI didn't return proper JSON despite the instruction
      insights = aiText.split('\n').map((l: string) => l.trim().replace(/^[-*]\s*/, '')).filter(Boolean);
    }

    return NextResponse.json({ insights });

  } catch (error: any) {
    console.error("AI Insights Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
