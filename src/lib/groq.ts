import "server-only";
import { ChatGroq } from "@langchain/groq";

export const DEFAULT_MODEL = "llama-3.3-70b-versatile";

/** Reads the user's own Groq key (BYOK) from the request. Never stored or logged. */
export function readKey(req: Request): string | null {
  const key = req.headers.get("x-groq-key")?.trim();
  return key && key.length > 10 ? key : null;
}

export function makeLLM(apiKey: string, model?: string, opts: { temperature?: number; maxTokens?: number } = {}) {
  return new ChatGroq({
    apiKey,
    model: model || DEFAULT_MODEL,
    temperature: opts.temperature ?? 0.3,
    maxTokens: opts.maxTokens ?? 1200,
    maxRetries: 2,
  });
}

export function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/401|invalid api key|invalid_api_key/i.test(msg)) return "Groq rejected the API key (401). Check your key in the 🔑 Groq Key dialog.";
  if (/429|rate limit/i.test(msg)) return "Groq rate limit reached (429). Wait a minute or pick a smaller/faster model such as llama-3.1-8b-instant.";
  if (/model.*(not found|decommissioned|does not exist)/i.test(msg)) return "That model isn't available on your Groq account. Pick another one in the 🔑 Groq Key dialog.";
  return msg.replace(/gsk_[A-Za-z0-9]+/g, "gsk_***");
}

export function textOf(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content))
    return content.map((c) => (typeof c === "string" ? c : (c as { text?: string })?.text ?? "")).join("");
  return "";
}

export function ndjsonStream(run: (send: (event: object) => void) => Promise<void>) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (e: object) => {
        try { controller.enqueue(encoder.encode(JSON.stringify(e) + "\n")); } catch { /* closed */ }
      };
      try {
        await run(send);
      } catch (err) {
        send({ type: "error", message: friendlyError(err) });
      } finally {
        try { controller.close(); } catch { /* already closed */ }
      }
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" },
  });
}
