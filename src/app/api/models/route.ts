import { readKey, friendlyError } from "@/lib/groq";

// Validates the user's Groq key (BYOK) and lists the chat models it can use.
export async function GET(req: Request) {
  const key = readKey(req);
  if (!key) return Response.json({ ok: false, error: "Missing Groq API key" }, { status: 400 });
  try {
    const r = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    if (!r.ok) return Response.json({ ok: false, error: friendlyError(`${r.status} ${await r.text()}`) }, { status: r.status });
    const data = (await r.json()) as { data: { id: string; active?: boolean }[] };
    const models = data.data
      .filter((m) => m.active !== false && !/whisper|tts|guard|distil|playai|orpheus/i.test(m.id))
      .map((m) => m.id)
      .sort();
    return Response.json({ ok: true, models });
  } catch (e) {
    return Response.json({ ok: false, error: friendlyError(e) }, { status: 500 });
  }
}
