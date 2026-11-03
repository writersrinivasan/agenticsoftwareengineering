"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Play, Pause, RotateCcw, SkipForward } from "lucide-react";
import { MODULES, SESSION } from "@/lib/curriculum";

const TOTAL = MODULES.reduce((s, m) => s + m.minutes, 0) * 60;
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export default function AgendaClient() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setElapsed((e) => Math.min(TOTAL, e + 1)), 1000);
    return () => clearInterval(id);
  }, [running]);

  const blocks = MODULES.map((m, i) => {
    const s = MODULES.slice(0, i).reduce((sum, x) => sum + x.minutes * 60, 0);
    return { ...m, s, e: s + m.minutes * 60 };
  });
  const current = blocks.find((b) => elapsed >= b.s && elapsed < b.e) ?? blocks[blocks.length - 1];
  const left = current.e - elapsed;

  const skip = () => setElapsed(current.e >= TOTAL ? TOTAL : current.e);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-4xl font-extrabold">Session <span className="gradient-text">run-sheet</span></h1>
      <p className="mt-1 text-muted">{SESSION.title}: {SESSION.subtitle} · {SESSION.audience} · {SESSION.duration}</p>

      {/* Timer */}
      <div className={`mt-6 overflow-hidden rounded-3xl bg-gradient-to-br ${current.color} p-6`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-white/80">Now · {current.start}</div>
            <div className="font-display text-2xl font-extrabold sm:text-3xl">{current.emoji} {current.title}</div>
            <div className="mt-1 text-sm text-white/80">{fmt(left)} left in this block · {fmt(TOTAL - elapsed)} left in session</div>
          </div>
          <div className="font-mono text-5xl font-bold tabular-nums sm:text-6xl">{fmt(elapsed)}</div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/25">
          <div className="h-full rounded-full bg-white/90 transition-all" style={{ width: `${(elapsed / TOTAL) * 100}%` }} />
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={() => setRunning(!running)} className="flex items-center gap-1.5 rounded-full bg-black/30 px-4 py-2 text-sm font-bold hover:bg-black/40">
            {running ? <><Pause className="h-4 w-4" /> Pause</> : <><Play className="h-4 w-4" /> {elapsed ? "Resume" : "Start session"}</>}
          </button>
          <button onClick={skip} className="flex items-center gap-1.5 rounded-full bg-black/20 px-4 py-2 text-sm font-semibold hover:bg-black/40"><SkipForward className="h-4 w-4" /> Next block</button>
          <button onClick={() => { setElapsed(0); setRunning(false); }} className="flex items-center gap-1.5 rounded-full bg-black/20 px-4 py-2 text-sm font-semibold hover:bg-black/40"><RotateCcw className="h-4 w-4" /> Reset</button>
        </div>
      </div>

      {/* Blocks */}
      <ol className="mt-8 space-y-3">
        {blocks.map((b) => {
          const state = elapsed >= b.e ? "past" : b.id === current.id ? "now" : "next";
          return (
            <li key={b.id} className={`glass flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-start ${state === "now" ? "ring-2 ring-fuchsia-400" : state === "past" ? "opacity-50" : ""}`}>
              <div className="flex items-center gap-3 sm:w-40 sm:shrink-0">
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${b.color} text-xl`}>{b.emoji}</span>
                <div>
                  <div className="font-mono text-sm font-bold">{b.start}</div>
                  <div className="text-xs text-muted">{b.minutes} min</div>
                </div>
              </div>
              <div className="flex-1">
                <Link href={b.id === "lab" ? "/labs" : `/learn#${b.id}`} className="font-display text-lg font-bold hover:text-fuchsia-200">{b.title}</Link>
                <ul className="mt-1 text-sm text-muted">
                  {b.objectives.map((o) => <li key={o}>• {o}</li>)}
                </ul>
                <div className="mt-2 rounded-xl bg-amber-500/10 p-2.5 text-xs text-amber-100">
                  <b>Facilitator:</b> {b.facilitator.join(" · ")}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="glass mt-8 rounded-3xl p-5 text-sm">
        <h2 className="font-display text-lg font-bold">✅ Pre-session checklist</h2>
        <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
          <li>☐ Each participant has a Groq API key (console.groq.com/keys)</li>
          <li>☐ App is running (<code>npm run dev</code>) and the URL has been shared</li>
          <li>☐ Squads of 3–4 formed; at least 6 verticals assigned</li>
          <li>☐ Fallback model chosen for rate limits (llama-3.1-8b-instant)</li>
          <li>☐ Whiteboard / Miro board ready for squad debriefs</li>
          <li>☐ Spanish output demo prepared (🇲🇽 Español toggle in the Labs page)</li>
        </ul>
      </div>
    </div>
  );
}
