"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Square, RotateCcw, Download, KeyRound, Check, X as XIcon, Languages, ShieldQuestion, Repeat, Activity, ClipboardList } from "lucide-react";
import { VERTICALS, PHASES, type Vertical } from "@/lib/verticals";
import { useGroq } from "@/components/GroqKeyProvider";
import PipelineGraph, { AGENTS, type NodeStatus } from "@/components/PipelineGraph";
import Markdown from "@/components/Markdown";
import { streamEvents } from "@/lib/stream";

interface HistoryItem { node: string; round: number; content: string }
interface TraceItem { t: number; icon: string; text: string }
type RunPhase = "idle" | "running" | "paused" | "done" | "error";

type Ev =
  | { type: "start"; threadId: string; resumed: boolean }
  | { type: "node_start"; node: string; round?: number }
  | { type: "token"; node: string; text: string }
  | { type: "node_end"; node: string; update: { history?: HistoryItem[]; qaVerdict?: string; devRound?: number; archRound?: number; approved?: boolean } }
  | { type: "interrupt"; value: { round: number; design: string } }
  | { type: "paused" | "done"; threadId: string }
  | { type: "error"; message: string };

const label = (id: string) => AGENTS.find((a) => a.id === id)?.label ?? id;
const emoji = (id: string) => AGENTS.find((a) => a.id === id)?.emoji ?? "•";

const REJECT_SUGGESTIONS = [
  "Add an explicit latency budget per component and justify the caching strategy.",
  "Design must keep working offline / degraded when a downstream dependency fails.",
  "Every automated decision must be logged with a human-readable reason code for audit.",
  "Reduce scope: an MVP with at most 4 components; move the rest to phase 2.",
];

export default function LabsClient() {
  const { ready, headers, model, openDialog } = useGroq();
  const [vid, setVid] = useState(VERTICALS[0].id);
  const v = VERTICALS.find((x) => x.id === vid) as Vertical;

  const [requirement, setRequirement] = useState(v.requirement);
  const [language, setLanguage] = useState<"English" | "Español">("English");
  const [hitl, setHitl] = useState(false);
  const [forceReflection, setForceReflection] = useState(false);

  const [phase, setPhase] = useState<RunPhase>("idle");
  const [error, setError] = useState("");
  const [status, setStatus] = useState<Record<string, NodeStatus>>({});
  const [edges, setEdges] = useState<Set<string>>(new Set());
  const [activeEdge, setActiveEdge] = useState<string | null>(null);
  const [live, setLive] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [trace, setTrace] = useState<TraceItem[]>([]);
  const [selected, setSelected] = useState<string>("requirements_analyst");
  const [follow, setFollow] = useState(true);
  const [viewRound, setViewRound] = useState<Record<string, number>>({});
  const [gate, setGate] = useState<{ round: number; design: string } | null>(null);
  const [feedback, setFeedback] = useState("");
  const [checks, setChecks] = useState<Record<string, boolean>>({});

  const threadRef = useRef<string | null>(null);
  const lastNode = useRef<string>("START");
  const abortRef = useRef<AbortController | null>(null);
  const t0 = useRef<number>(0);

  const pickVertical = (id: string) => {
    if (phase === "running") return;
    const nv = VERTICALS.find((x) => x.id === id)!;
    setVid(id);
    setRequirement(nv.requirement);
    reset();
  };

  const reset = () => {
    setPhase("idle"); setError(""); setStatus({}); setEdges(new Set()); setActiveEdge(null);
    setLive({}); setHistory([]); setTrace([]); setGate(null); setFeedback(""); setViewRound({});
    setSelected("requirements_analyst");
    threadRef.current = null; lastNode.current = "START";
  };

  // deep link: /labs?v=retail
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("v");
    const nv = VERTICALS.find((x) => x.id === q);
    if (nv) { setVid(nv.id); setRequirement(nv.requirement); }
    try { setChecks(JSON.parse(localStorage.getItem("ase.lab.checks") || "{}")); } catch {}
  }, []);

  const addTrace = (icon: string, text: string) =>
    setTrace((t) => [...t, { t: (Date.now() - t0.current) / 1000, icon, text }]);

  const traverse = (to: string) => {
    const k = `${lastNode.current}>${to}`;
    setEdges((e) => new Set(e).add(k));
    setActiveEdge(k);
    lastNode.current = to;
  };

  const onEvent = useCallback((e: Ev) => {
    switch (e.type) {
      case "start":
        threadRef.current = e.threadId;
        addTrace("🧵", e.resumed ? "Resumed thread from checkpoint" : `New LangGraph thread ${e.threadId.slice(0, 8)}…`);
        break;
      case "node_start":
        // On resume, LangGraph re-enters the interrupted node: don't log it twice.
        if (e.node === lastNode.current) break;
        traverse(e.node);
        setStatus((s) => ({ ...s, [e.node]: e.node === "review_gate" ? "waiting" : "running" }));
        setLive((l) => ({ ...l, [e.node]: "" }));
        if (follow && e.node !== "review_gate") setSelected(e.node);
        addTrace(emoji(e.node), `${label(e.node)} started${e.round && e.round > 1 ? ` (round ${e.round})` : ""}`);
        break;
      case "token":
        setLive((l) => ({ ...l, [e.node]: (l[e.node] ?? "") + e.text }));
        break;
      case "node_end": {
        setStatus((s) => ({ ...s, [e.node]: "done" }));
        const h = e.update.history ?? [];
        if (h.length) {
          setHistory((x) => [...x, ...h]);
          setViewRound((r) => ({ ...r, [e.node]: h[h.length - 1].round }));
        }
        if (e.node === "qa_engineer") addTrace(e.update.qaVerdict === "FAIL" ? "🔴" : "🟢", `QA verdict: ${e.update.qaVerdict}`);
        else if (e.node === "review_gate") addTrace(e.update.approved ? "✅" : "❌", e.update.approved ? "Human approved the design" : "Human rejected the design, routing back to Architect");
        else addTrace("✓", `${label(e.node)} finished`);
        break;
      }
      case "interrupt":
        setGate({ round: e.value.round, design: e.value.design });
        setSelected("architect");
        addTrace("⏸️", "interrupt(): graph paused for human Architecture Review");
        break;
      case "paused":
        setPhase("paused");
        setActiveEdge(null);
        break;
      case "done":
        traverse("END");
        setActiveEdge(null);
        setPhase("done");
        addTrace("🏁", "Pipeline reached END");
        break;
      case "error":
        setError(e.message);
        setPhase("error");
        setStatus((s) => Object.fromEntries(Object.entries(s).map(([k, val]) => [k, val === "running" ? "idle" : val])));
        addTrace("⚠️", e.message);
        break;
    }
  }, [follow]);

  const run = async (body: object) => {
    setPhase("running"); setError("");
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      await streamEvents<Ev>("/api/pipeline", { ...body, model }, headers, onEvent, ac.signal);
    } catch (err) {
      if ((err as Error).name === "AbortError") { setPhase("idle"); addTrace("⏹️", "Run stopped by user"); }
      else onEvent({ type: "error", message: (err as Error).message });
    }
  };

  const start = () => {
    if (!ready) return openDialog();
    reset();
    // Runs in a click handler, not during render (compiler false positive).
    // eslint-disable-next-line react-hooks/purity
    t0.current = Date.now();
    run({ verticalId: vid, requirement, language, hitl, forceReflection });
  };

  const decide = (approved: boolean) => {
    if (!threadRef.current) return;
    if (!approved && !feedback.trim()) return;
    setGate(null);
    run({ threadId: threadRef.current, resume: { approved, feedback: feedback.trim() } });
    setFeedback("");
  };

  const stop = () => abortRef.current?.abort();

  const roundsFor = (node: string) => history.filter((h) => h.node === node);
  const maxRound = Object.fromEntries(AGENTS.map((a) => [a.id, Math.max(0, ...roundsFor(a.id).map((h) => h.round))]));

  const shown = (() => {
    if (status[selected] === "running") return { text: live[selected] ?? "", streaming: true };
    const items = roundsFor(selected);
    const r = viewRound[selected] ?? items.at(-1)?.round;
    const it = items.filter((h) => h.round === r).at(-1);
    return { text: it?.content ?? "", streaming: false };
  })();

  const exportReport = () => {
    const order = AGENTS.map((a) => a.id);
    const lines = [
      `# Agentic SDLC Run Report: ${v.name}`,
      `- Date: ${new Date().toLocaleString()}`,
      `- Model: ${model} (Groq) · Framework: LangGraph`,
      `- Language: ${language} · Human gate: ${hitl ? "ON" : "OFF"} · Forced reflection: ${forceReflection ? "ON" : "OFF"}`,
      "",
      "## Business requirement",
      requirement,
      "",
      "## Execution trace",
      ...trace.map((t) => `- [${t.t.toFixed(1)}s] ${t.icon} ${t.text}`),
      "",
      ...order.flatMap((id) =>
        roundsFor(id).map((h) => `---\n\n## ${emoji(id)} ${label(id)}${maxRound[id] > 1 ? ` (round ${h.round})` : ""}\n\n${h.content}\n`)
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `agentic-sdlc-${v.id}-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const toggleCheck = (k: string) => {
    const next = { ...checks, [k]: !checks[k] };
    setChecks(next);
    try { localStorage.setItem("ase.lab.checks", JSON.stringify(next)); } catch {}
  };

  const busy = phase === "running";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl font-extrabold">Hands-on <span className="gradient-text">Agentic SDLC Lab</span></h1>
          <p className="mt-1 text-muted">Pick a vertical → run an 8-agent LangGraph pipeline from requirements to production → govern it as a human.</p>
        </div>
        {!ready && (
          <button onClick={openDialog} className="flex items-center gap-2 rounded-full bg-amber-500/20 px-4 py-2 text-sm font-semibold text-amber-100 ring-1 ring-amber-400/50">
            <KeyRound className="h-4 w-4" /> Add your Groq key to run the lab
          </button>
        )}
      </div>

      {/* Vertical picker */}
      <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
        {VERTICALS.map((x) => (
          <button
            key={x.id}
            onClick={() => pickVertical(x.id)}
            disabled={busy}
            className={`rounded-2xl p-3 text-left transition disabled:cursor-not-allowed ${x.id === vid ? `bg-gradient-to-br ${x.gradient} shadow-lg` : "glass hover:bg-white/10"}`}
          >
            <div className="text-2xl">{x.emoji}</div>
            <div className="mt-1 text-xs font-bold leading-tight">{x.short}</div>
          </button>
        ))}
      </div>

      {/* Scenario */}
      <section className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="glass rounded-3xl p-5">
          <div className="flex items-center gap-3">
            <span className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${v.gradient} text-2xl`}>{v.emoji}</span>
            <div>
              <h2 className="font-display text-xl font-bold">{v.name}</h2>
              <p className="text-sm text-muted">{v.client}</p>
            </div>
          </div>
          <label className="mt-4 block text-xs font-bold uppercase tracking-wider text-muted">Business requirement (editable: this is the agents&apos; input)</label>
          <textarea
            value={requirement}
            onChange={(e) => setRequirement(e.target.value)}
            disabled={busy}
            rows={6}
            className="mt-1 w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-sm leading-relaxed outline-none focus:border-fuchsia-400"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {v.compliance.map((c) => <span key={c} className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px]">🛡️ {c}</span>)}
          </div>

          {/* Controls */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button onClick={() => setLanguage(language === "English" ? "Español" : "English")} disabled={busy} className="glass flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold hover:bg-white/10">
              <Languages className="h-3.5 w-3.5" /> Output: {language === "English" ? "🇺🇸 English" : "🇲🇽 Español"}
            </button>
            <Toggle on={hitl} set={setHitl} disabled={busy} icon={<ShieldQuestion className="h-3.5 w-3.5" />} label="Architecture Review gate (HITL)" />
            <Toggle on={forceReflection} set={setForceReflection} disabled={busy} icon={<Repeat className="h-3.5 w-3.5" />} label="Force reflection loop" />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {!busy ? (
              <button onClick={start} className="flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-500 px-6 py-2.5 font-bold shadow-lg shadow-fuchsia-500/30 hover:brightness-110">
                <Play className="h-4 w-4" /> {phase === "idle" ? "Run agentic pipeline" : "Run again"}
              </button>
            ) : (
              <button onClick={stop} className="flex items-center gap-2 rounded-full bg-rose-500/80 px-6 py-2.5 font-bold hover:bg-rose-500">
                <Square className="h-4 w-4" /> Stop
              </button>
            )}
            <button onClick={reset} disabled={busy} className="glass flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold disabled:opacity-40"><RotateCcw className="h-4 w-4" /> Reset</button>
            <button onClick={exportReport} disabled={!history.length} className="glass flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold disabled:opacity-40"><Download className="h-4 w-4" /> Export report (.md)</button>
          </div>
        </div>

        {/* Traditional vs agentic + metrics */}
        <div className="glass rounded-3xl p-5">
          <h3 className="font-display font-bold">How this vertical changes</h3>
          <div className="mt-3 max-h-[300px] space-y-2 overflow-y-auto pr-1">
            {PHASES.map((p) => (
              <details key={p.key} className="rounded-xl bg-white/5 p-2.5 text-sm open:bg-white/10">
                <summary className="cursor-pointer font-semibold">{p.icon} {p.label}</summary>
                <p className="mt-1.5 text-slate-300"><b className="text-slate-400">Traditional:</b> {v.traditional[p.key]}</p>
                <p className="mt-1 text-fuchsia-100"><b className="text-fuchsia-300">Agentic:</b> {v.agentic[p.key]}</p>
              </details>
            ))}
          </div>
          <h3 className="mt-4 font-display font-bold">Impact (illustrative targets)</h3>
          <div className="mt-2 space-y-2">
            {v.metrics.map((m) => {
              const max = Math.max(m.before, m.after);
              return (
                <div key={m.label} className="text-xs">
                  <div className="flex justify-between"><span>{m.label}</span><span className="font-mono">{m.before}{m.unit} → <b>{m.after}{m.unit}</b></span></div>
                  <div className="mt-1 flex flex-col gap-0.5">
                    <div className="h-1.5 rounded-full bg-slate-500/60" style={{ width: `${(m.before / max) * 100}%` }} />
                    <div className={`h-1.5 rounded-full bg-gradient-to-r ${v.gradient}`} style={{ width: `${(m.after / max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Graph */}
      <section className="glass mt-6 rounded-3xl p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1">
          <h3 className="flex items-center gap-2 font-display font-bold"><Activity className="h-4 w-4 text-fuchsia-300" /> LangGraph state machine (live)</h3>
          <div className="flex items-center gap-3 text-xs text-muted">
            <span className={`rounded-full px-2 py-0.5 font-semibold ${phase === "running" ? "bg-fuchsia-500/30 text-fuchsia-100" : phase === "paused" ? "bg-amber-500/30 text-amber-100" : phase === "done" ? "bg-emerald-500/30 text-emerald-100" : phase === "error" ? "bg-rose-500/30 text-rose-100" : "bg-white/10"}`}>
              {phase === "running" ? "● running" : phase === "paused" ? "⏸ waiting for human" : phase === "done" ? "✓ complete" : phase === "error" ? "⚠ error" : "idle"}
            </span>
            <label className="flex items-center gap-1"><input type="checkbox" checked={follow} onChange={(e) => setFollow(e.target.checked)} className="accent-fuchsia-500" /> auto-follow</label>
          </div>
        </div>
        <PipelineGraph status={status} edges={edges} activeEdge={activeEdge} rounds={maxRound} hitl={hitl} selected={selected} onSelect={setSelected} />
        {error && <p className="mt-2 rounded-xl bg-rose-500/15 p-3 text-sm text-rose-100">⚠️ {error}</p>}
      </section>

      {/* HITL gate */}
      {gate && phase === "paused" && (
        <section className="mt-6 rounded-3xl border-2 border-amber-400/60 bg-amber-500/10 p-5 shadow-xl shadow-amber-500/10">
          <h3 className="font-display text-xl font-bold text-amber-100">🙋 Architecture Review Board: you decide (design v{gate.round})</h3>
          <p className="mt-1 text-sm text-amber-50/80">
            The graph called <code className="rounded bg-black/30 px-1">interrupt()</code> and its state is saved by the checkpointer. Read the Architect&apos;s design (opened below), then approve it or reject it with feedback. A rejection routes back to the Architect (max 3 rounds).
          </p>
          <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={3} placeholder="Feedback for the Architect (required to reject, optional to approve)…" className="mt-3 w-full rounded-2xl border border-amber-300/30 bg-black/30 p-3 text-sm outline-none focus:border-amber-300" />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {REJECT_SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => setFeedback(s)} className="rounded-full bg-black/20 px-2.5 py-1 text-[11px] text-amber-100 hover:bg-black/40">+ {s.slice(0, 48)}…</button>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={() => decide(true)} className="flex items-center gap-1.5 rounded-full bg-emerald-500 px-5 py-2 font-bold text-emerald-950 hover:bg-emerald-400"><Check className="h-4 w-4" /> Approve</button>
            <button onClick={() => decide(false)} disabled={!feedback.trim()} className="flex items-center gap-1.5 rounded-full bg-rose-500 px-5 py-2 font-bold hover:bg-rose-400 disabled:opacity-40"><XIcon className="h-4 w-4" /> Reject with feedback</button>
          </div>
        </section>
      )}

      {/* Outputs + trace */}
      <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="glass min-w-0 rounded-3xl">
          <div className="flex gap-1 overflow-x-auto border-b border-white/10 p-2">
            {AGENTS.map((a) => {
              const s = status[a.id];
              return (
                <button key={a.id} onClick={() => setSelected(a.id)} className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold transition ${selected === a.id ? "bg-white/15" : "text-muted hover:bg-white/5"}`}>
                  <span>{a.emoji}</span> {a.label}
                  {s === "running" && <span className="h-2 w-2 animate-ping rounded-full bg-fuchsia-400" />}
                  {s === "done" && <span className="h-2 w-2 rounded-full" style={{ background: a.color }} />}
                </button>
              );
            })}
          </div>
          <div className="p-5">
            {maxRound[selected] > 1 && (
              <div className="mb-3 flex items-center gap-1.5 text-xs">
                <span className="text-muted">Versions:</span>
                {roundsFor(selected).filter((h, i, arr) => arr.findIndex((x) => x.round === h.round) === i).map((h) => (
                  <button key={h.round} onClick={() => setViewRound((r) => ({ ...r, [selected]: h.round }))} className={`rounded-full px-2.5 py-0.5 font-semibold ${(viewRound[selected] ?? maxRound[selected]) === h.round ? "bg-fuchsia-500/40" : "bg-white/10"}`}>
                    v{h.round}
                  </button>
                ))}
              </div>
            )}
            {shown.text ? (
              <div className={shown.streaming ? "caret" : ""}><Markdown>{shown.text}</Markdown></div>
            ) : (
              <div className="py-16 text-center text-muted">
                <div className="text-5xl">{emoji(selected)}</div>
                <p className="mt-3">{status[selected] === "running" ? "Agent is thinking…" : selected === "review_gate" ? "This is where you, the human, approve or reject. Turn on the HITL gate to use it." : `${label(selected)} output will appear here when the pipeline runs.`}</p>
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="glass rounded-3xl p-4">
            <h3 className="font-display font-bold">🧭 Execution trace</h3>
            <ol className="mt-2 max-h-80 space-y-1.5 overflow-y-auto text-xs">
              {trace.length === 0 && <li className="text-muted">Events from the LangGraph stream appear here.</li>}
              {trace.map((t, i) => (
                <li key={i} className="flex gap-2"><span className="w-10 shrink-0 font-mono text-muted">{t.t.toFixed(1)}s</span><span>{t.icon}</span><span>{t.text}</span></li>
              ))}
            </ol>
          </div>
          <div className="glass rounded-3xl p-4">
            <h3 className="flex items-center gap-2 font-display font-bold"><ClipboardList className="h-4 w-4" /> {v.short} exercises</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {v.exercises.map((ex, i) => {
                const k = `${v.id}:${i}`;
                return (
                  <li key={k}>
                    <label className="flex cursor-pointer gap-2">
                      <input type="checkbox" checked={!!checks[k]} onChange={() => toggleCheck(k)} className="mt-1 accent-emerald-500" />
                      <span className={checks[k] ? "text-muted line-through" : ""}>{ex}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
            <h4 className="mt-4 text-xs font-bold uppercase tracking-wider text-muted">Squad reflection</h4>
            <ul className="mt-1 space-y-1 text-sm text-cyan-100">
              {v.reflection.map((r) => <li key={r}>💬 {r}</li>)}
            </ul>
          </div>
        </aside>
      </section>
    </div>
  );
}

function Toggle({ on, set, label, icon, disabled }: { on: boolean; set: (b: boolean) => void; label: string; icon: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      onClick={() => set(!on)}
      disabled={disabled}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${on ? "bg-gradient-to-r from-amber-400 to-orange-500 text-black" : "glass hover:bg-white/10"}`}
    >
      {icon} {label} <span className={`ml-0.5 rounded-full px-1.5 text-[10px] ${on ? "bg-black/20" : "bg-white/10"}`}>{on ? "ON" : "OFF"}</span>
    </button>
  );
}
