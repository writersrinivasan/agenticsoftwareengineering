"use client";
import { useEffect, useRef, useState } from "react";
import { Send, Bot, User, Wrench, Trash2, KeyRound, Square } from "lucide-react";
import { useGroq } from "@/components/GroqKeyProvider";
import Markdown from "@/components/Markdown";
import { streamEvents } from "@/lib/stream";

interface Msg { role: "user" | "assistant"; content: string; tools?: string[] }
type Ev = { type: "token"; text: string } | { type: "tool_call"; name: string; args: unknown } | { type: "tool_result"; name: string } | { type: "done" } | { type: "error"; message: string };

const STARTERS = [
  "Explain how LangGraph's interrupt() enables human-in-the-loop, with a TypeScript example.",
  "Compare the Test phase across all verticals: traditional vs agentic.",
  "¿Cuáles son los riesgos de seguridad de un agente que escribe código?",
  "Design a 3-node LangGraph workflow that turns Jira tickets into test cases.",
  "What compliance items matter for the logistics vertical?",
  "How do I measure ROI of an agentic SDLC for a banking client?",
];

const STORE = "ase.chat";

export default function AssistantClient() {
  const { ready, headers, model, openDialog } = useGroq();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    try { const s = sessionStorage.getItem(STORE); if (s) setMsgs(JSON.parse(s)); } catch {}
  }, []);
  useEffect(() => {
    try { sessionStorage.setItem(STORE, JSON.stringify(msgs)); } catch {}
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs]);

  const send = async (text: string) => {
    if (!text.trim() || busy) return;
    if (!ready) return openDialog();
    const history: Msg[] = [...msgs, { role: "user", content: text.trim() }];
    setMsgs([...history, { role: "assistant", content: "", tools: [] }]);
    setInput("");
    setBusy(true);
    const patch = (fn: (m: Msg) => Msg) => setMsgs((all) => [...all.slice(0, -1), fn(all[all.length - 1])]);
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      await streamEvents<Ev>(
        "/api/assistant",
        { messages: history.map(({ role, content }) => ({ role, content })), model },
        headers,
        (e) => {
          if (e.type === "token") patch((m) => ({ ...m, content: m.content + e.text }));
          else if (e.type === "tool_call") patch((m) => ({ ...m, tools: [...(m.tools ?? []), `${e.name}(${JSON.stringify(e.args)})`] }));
          else if (e.type === "error") patch((m) => ({ ...m, content: m.content + `\n\n> ⚠️ ${e.message}` }));
        },
        ac.signal
      );
    } catch (err) {
      if ((err as Error).name !== "AbortError") patch((m) => ({ ...m, content: m.content + `\n\n> ⚠️ ${(err as Error).message}` }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col px-4 py-8" style={{ minHeight: "calc(100vh - 140px)" }}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl font-extrabold">Agente <span className="gradient-text">ASE</span></h1>
          <p className="mt-1 text-sm text-muted">A LangGraph ReAct agent (agent ⇄ tools loop) on Groq · model <code className="text-fuchsia-200">{model}</code> · English / Español</p>
        </div>
        <div className="flex gap-2">
          {!ready && <button onClick={openDialog} className="flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1.5 text-sm font-semibold text-amber-100 ring-1 ring-amber-400/50"><KeyRound className="h-4 w-4" /> Add Groq key</button>}
          {msgs.length > 0 && <button onClick={() => setMsgs([])} disabled={busy} className="glass flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm"><Trash2 className="h-4 w-4" /> Clear</button>}
        </div>
      </div>

      <div className="mt-6 flex-1 space-y-4">
        {msgs.length === 0 && (
          <div className="glass rounded-3xl p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-amber-400 via-rose-500 to-fuchsia-600"><Bot className="h-6 w-6" /></div>
              <div>
                <p className="font-semibold">¡Hola! I&apos;m your Agentic SE tutor.</p>
                <p className="text-sm text-muted">My tools can look up the session&apos;s modules, the 8 vertical scenarios and SDLC phase comparisons.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {STARTERS.map((s) => (
                <button key={s} onClick={() => send(s)} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-left text-sm hover:border-fuchsia-400/50 hover:bg-white/10">{s}</button>
              ))}
            </div>
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${m.role === "user" ? "bg-gradient-to-br from-cyan-500 to-blue-600" : "bg-gradient-to-br from-amber-400 via-rose-500 to-fuchsia-600"}`}>
              {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>
            <div className={`min-w-0 max-w-[85%] rounded-3xl px-4 py-3 ${m.role === "user" ? "bg-gradient-to-br from-cyan-600/40 to-blue-700/40" : "glass"}`}>
              {!!m.tools?.length && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {m.tools.map((t, j) => (
                    <span key={j} className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] text-emerald-200"><Wrench className="h-3 w-3" /> {t.length > 60 ? t.slice(0, 60) + "…" : t}</span>
                  ))}
                </div>
              )}
              {m.role === "user" ? (
                <p className="whitespace-pre-wrap text-sm">{m.content}</p>
              ) : m.content ? (
                <div className={busy && i === msgs.length - 1 ? "caret" : ""}><Markdown>{m.content}</Markdown></div>
              ) : (
                <p className="text-sm text-muted"><span className="animate-pulse">{m.tools?.length ? "Using tools, then thinking…" : "Thinking…"}</span></p>
              )}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="glass sticky bottom-4 mt-6 flex items-end gap-2 rounded-3xl p-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
          rows={1}
          placeholder="Ask about agents, LangGraph, AI-SDLC, verticals… (Enter to send)"
          className="max-h-40 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-sm outline-none"
        />
        {busy ? (
          <button type="button" onClick={() => abortRef.current?.abort()} className="grid h-11 w-11 place-items-center rounded-2xl bg-rose-500"><Square className="h-4 w-4" /></button>
        ) : (
          <button type="submit" disabled={!input.trim()} className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-cyan-500 disabled:opacity-40"><Send className="h-4 w-4" /></button>
        )}
      </form>
    </div>
  );
}
