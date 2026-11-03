"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, ChevronLeft, ChevronRight, Clock, Lightbulb, Target, FlaskConical } from "lucide-react";
import { MODULES } from "@/lib/curriculum";
import Markdown from "@/components/Markdown";
import Quiz from "@/components/Quiz";

const DONE_KEY = "ase.learn.done";

export default function LearnClient() {
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const [notes, setNotes] = useState(false);

  useEffect(() => {
    const sync = () => {
      const h = window.location.hash.slice(1);
      const i = MODULES.findIndex((m) => m.id === h);
      if (i >= 0) setIdx(i);
    };
    sync();
    window.addEventListener("hashchange", sync);
    try { setDone(JSON.parse(localStorage.getItem(DONE_KEY) || "[]")); } catch {}
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const go = (i: number) => {
    setIdx(i);
    history.replaceState(null, "", `#${MODULES[i].id}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const toggleDone = (id: string) => {
    const next = done.includes(id) ? done.filter((d) => d !== id) : [...done, id];
    setDone(next);
    try { localStorage.setItem(DONE_KEY, JSON.stringify(next)); } catch {}
  };

  const m = MODULES[idx];
  const pct = Math.round((done.length / MODULES.length) * 100);

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[300px_1fr]">
      {/* Sidebar */}
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <div className="glass rounded-3xl p-4">
          <h2 className="font-display text-lg font-bold">Learning path</h2>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1 text-xs text-muted">{done.length}/{MODULES.length} modules complete · 120 min</p>
          <ol className="mt-4 space-y-1">
            {MODULES.map((mm, i) => (
              <li key={mm.id}>
                <button
                  onClick={() => go(i)}
                  className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm transition ${i === idx ? "bg-white/15 text-white" : "text-muted hover:bg-white/5 hover:text-white"}`}
                >
                  {done.includes(mm.id) ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" /> : <Circle className="h-4 w-4 shrink-0 opacity-40" />}
                  <span className="text-base">{mm.emoji}</span>
                  <span className="flex-1 leading-tight">{mm.title}</span>
                  <span className="font-mono text-[10px] opacity-70">{mm.minutes}′</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </aside>

      {/* Content */}
      <article className="min-w-0">
        <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${m.color} p-6 sm:p-8`}>
          <div className="absolute -right-6 -top-6 text-[9rem] opacity-20">{m.emoji}</div>
          <div className="relative">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/80">
              <span>Module {idx + 1} of {MODULES.length}</span>
              <span className="flex items-center gap-1 rounded-full bg-black/20 px-2 py-0.5"><Clock className="h-3 w-3" /> {m.start} · {m.minutes} min</span>
            </div>
            <h1 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">{m.title}</h1>
            <ul className="mt-4 space-y-1">
              {m.objectives.map((o) => (
                <li key={o} className="flex items-start gap-2 text-sm text-white/90"><Target className="mt-0.5 h-4 w-4 shrink-0" /> {o}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="glass mt-6 rounded-3xl p-5 sm:p-8">
          <Markdown>{m.body}</Markdown>
          {m.id === "lab" && (
            <Link href="/labs" className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-lime-500 to-emerald-600 px-5 py-2.5 font-bold">
              <FlaskConical className="h-4 w-4" /> Go to the Hands-on Labs
            </Link>
          )}
        </div>

        <div className="mt-4">
          <button onClick={() => setNotes(!notes)} className="flex items-center gap-2 text-sm font-semibold text-amber-200 hover:text-amber-100">
            <Lightbulb className="h-4 w-4" /> {notes ? "Hide" : "Show"} facilitator notes
          </button>
          {notes && (
            <ul className="mt-2 space-y-1 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-50">
              {m.facilitator.map((f) => <li key={f}>• {f}</li>)}
            </ul>
          )}
        </div>

        <Quiz key={m.id} items={m.quiz} />

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <button disabled={idx === 0} onClick={() => go(idx - 1)} className="glass flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-30">
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>
          <button
            onClick={() => toggleDone(m.id)}
            className={`rounded-full px-5 py-2 text-sm font-bold ${done.includes(m.id) ? "bg-emerald-500/20 text-emerald-200" : "bg-gradient-to-r from-emerald-500 to-cyan-500"}`}
          >
            {done.includes(m.id) ? "✓ Completed" : "Mark complete"}
          </button>
          <button disabled={idx === MODULES.length - 1} onClick={() => go(idx + 1)} className="glass flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-30">
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </article>
    </div>
  );
}
