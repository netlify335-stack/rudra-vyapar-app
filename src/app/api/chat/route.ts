// Direct Google Generative AI REST API — bypasses broken @ai-sdk/google SDK
export const maxDuration = 30;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
const MODEL = "gemini-3.5-flash";

export async function POST(req: Request) {
  const { messages, storeName, alerts } = await req.json();

  const systemPrompt = `Tu 'Rudra AI' hai, ek smart aur friendly assistant 'Rudra Vyapar' naam ke inventory aur billing software ke liye.
Tere user ka naam 'Bhai' hai, aur tujhe usse Hinglish (Hindi + English mix) me baat karni hai, jaise normal dost karte hain.
Tera tone helpful, thoda desi, aur professional hona chahiye.
Agar user kuch images upload kare, toh usko achhe se padh kar jawab dena (jaise bills, products, ya invoices).
System Context Data:
- Store Name is "${storeName || 'Unknown'}". 
- Current Alerts: Low Stock: ${alerts?.lowStock ?? 0}, Expiring soon: ${alerts?.expiring ?? 0}, Udhaar (Pending Payments): ${alerts?.udhaar ?? 0}. 
Agar context me dashboard ka data diya jaye (jaise sales, stock, ya udhaar), toh us data ko real-time samajh kar sahi advice dena.

Hamesha short aur to-the-point jawab dena, unless user details maange.`;

  // Convert AI SDK message format to Gemini API format
  const geminiContents = messages
    .filter((m: any) => m.role === "user" || m.role === "assistant")
    .map((m: any) => {
      const parts: any[] = [];

      // Text content
      if (m.content) {
        parts.push({ text: m.content });
      }

      // Image attachments
      if (m.experimental_attachments) {
        for (const att of m.experimental_attachments) {
          if (att.contentType?.startsWith("image/") && att.url) {
            // Extract base64 data from data URL
            const base64Match = att.url.match(/^data:[^;]+;base64,(.+)$/);
            if (base64Match) {
              parts.push({
                inlineData: {
                  mimeType: att.contentType,
                  data: base64Match[1],
                },
              });
            }
          }
        }
      }

      return {
        role: m.role === "assistant" ? "model" : "user",
        parts,
      };
    });

  try {
    const MODELS = [MODEL, "gemini-2.5-flash-lite"];
    let geminiRes: Response | null = null;

    for (const currentModel of MODELS) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;

      geminiRes = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: geminiContents,
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 2048,
          },
        }),
      });

      if (geminiRes.ok) break; // Success, use this response

      if (geminiRes.status === 429) {
        // Rate limited — try next model
        console.warn(`Rate limited on ${currentModel}, trying fallback...`);
        continue;
      }

      // Non-rate-limit error
      const errText = await geminiRes.text();
      console.error("Gemini API error:", geminiRes.status, errText);
      return new Response(JSON.stringify({ error: `Gemini API ${geminiRes.status}` }), {
        status: geminiRes.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!geminiRes || !geminiRes.ok) {
      return new Response(JSON.stringify({ error: "All AI models are rate-limited. Please try again in a minute." }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Stream the SSE response back as plain text
    const reader = geminiRes.body?.getReader();
    if (!reader) {
      return new Response("No response body", { status: 500 });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async pull(controller) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            controller.close();
            return;
          }

          const chunk = decoder.decode(value, { stream: true });
          // Parse SSE lines: each starts with "data: " followed by JSON
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const json = JSON.parse(line.slice(6));
                const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                  controller.enqueue(encoder.encode(text));
                }
              } catch {
                // skip malformed JSON chunks
              }
            }
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return new Response(JSON.stringify({ error: error.message || String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
