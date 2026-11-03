import { HumanMessage, AIMessage, type BaseMessage } from "@langchain/core/messages";
import { readKey, makeLLM, ndjsonStream, textOf } from "@/lib/groq";
import { buildAssistant } from "@/lib/agents/assistant";

interface Body {
  messages: { role: "user" | "assistant"; content: string }[];
  model?: string;
}

export async function POST(req: Request) {
  const key = readKey(req);
  if (!key) return Response.json({ error: "Missing Groq API key. Add it in the 🔑 Groq Key dialog." }, { status: 401 });
  const body = (await req.json()) as Body;

  const history: BaseMessage[] = (body.messages || [])
    .slice(-12)
    .map((m) => (m.role === "user" ? new HumanMessage(m.content.slice(0, 6000)) : new AIMessage(m.content.slice(0, 6000))));

  const graph = buildAssistant(makeLLM(key, body.model, { temperature: 0.4, maxTokens: 1500 }));

  return ndjsonStream(async (send) => {
    const stream = await graph.stream(
      { messages: history },
      { streamMode: ["messages", "updates"], recursionLimit: 12, signal: req.signal }
    );
    for await (const [mode, chunk] of stream as AsyncIterable<[string, unknown]>) {
      if (mode === "messages") {
        const [msg, meta] = chunk as [{ content: unknown }, { langgraph_node?: string }];
        if (meta?.langgraph_node !== "agent") continue;
        const text = textOf(msg?.content);
        if (text) send({ type: "token", text });
      } else {
        const upd = chunk as Record<string, { messages?: { tool_calls?: { name: string; args: unknown }[]; name?: string }[] }>;
        for (const m of upd.agent?.messages ?? [])
          for (const tc of m.tool_calls ?? []) send({ type: "tool_call", name: tc.name, args: tc.args });
        for (const m of upd.tools?.messages ?? []) send({ type: "tool_result", name: m.name });
      }
    }
    send({ type: "done" });
  });
}
