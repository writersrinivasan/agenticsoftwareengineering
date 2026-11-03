import { Command } from "@langchain/langgraph";
import { readKey, makeLLM, ndjsonStream, textOf } from "@/lib/groq";
import { buildPipeline, checkpointer } from "@/lib/agents/pipeline";
import { getVertical } from "@/lib/verticals";

interface Body {
  threadId?: string;
  resume?: { approved: boolean; feedback?: string };
  verticalId?: string;
  requirement?: string;
  language?: string;
  hitl?: boolean;
  forceReflection?: boolean;
  model?: string;
}

export async function POST(req: Request) {
  const key = readKey(req);
  if (!key) return Response.json({ error: "Missing Groq API key. Add it in the 🔑 Groq Key dialog." }, { status: 401 });
  const body = (await req.json()) as Body;

  const isResume = !!(body.threadId && body.resume);
  if (!isResume) {
    if (!body.verticalId || !getVertical(body.verticalId)) return Response.json({ error: "Unknown vertical" }, { status: 400 });
    if (!body.requirement?.trim()) return Response.json({ error: "Requirement is empty" }, { status: 400 });
  }

  const threadId = body.threadId || crypto.randomUUID();
  // The key lives only in this closure for the duration of the request; it's never put in graph state.
  const graph = buildPipeline((maxTokens) => makeLLM(key, body.model, { maxTokens }), checkpointer);

  type Input = Parameters<typeof graph.stream>[0];
  const input: Input = isResume
    ? (new Command({ resume: body.resume }) as unknown as Input)
    : {
        verticalId: body.verticalId!,
        requirement: body.requirement!.slice(0, 4000),
        language: body.language === "Español" ? "Spanish (Mexican Spanish)" : "English",
        hitl: !!body.hitl,
        forceReflection: !!body.forceReflection,
      };

  return ndjsonStream(async (send) => {
    send({ type: "start", threadId, resumed: isResume });
    const stream = await graph.stream(input, {
      configurable: { thread_id: threadId },
      streamMode: ["updates", "messages", "custom"],
      recursionLimit: 40,
      signal: req.signal,
    });
    let interrupted = false;
    for await (const [mode, chunk] of stream as AsyncIterable<[string, unknown]>) {
      if (mode === "custom") {
        send(chunk as object);
      } else if (mode === "messages") {
        const [msg, meta] = chunk as [{ content: unknown }, { langgraph_node?: string }];
        const text = textOf(msg?.content);
        if (text) send({ type: "token", node: meta?.langgraph_node, text });
      } else if (mode === "updates") {
        for (const [node, update] of Object.entries(chunk as Record<string, unknown>)) {
          if (node === "__interrupt__") {
            interrupted = true;
            const intr = (update as { value: unknown }[])[0];
            send({ type: "interrupt", value: intr?.value });
          } else {
            send({ type: "node_end", node, update });
          }
        }
      }
    }
    send({ type: interrupted ? "paused" : "done", threadId });
  });
}
