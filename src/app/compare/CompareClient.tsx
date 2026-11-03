"use client";
import { useState } from "react";
import { PHASES, VERTICALS, type PhaseKey } from "@/lib/verticals";

const GENERIC: Record<PhaseKey, { trad: string; ai: string; agent: string; human: string; artefacts: string }> = {
  requirements: {
    trad: "Workshops and long BRDs; ambiguity found late; weeks of back-and-forth.",
    ai: "Requirements agent drafts stories, Gherkin criteria, NFRs and compliance trace in minutes.",
    agent: "📝 Requirements Analyst",
    human: "Product owner validates intent and answers open questions",
    artefacts: "Epics, stories, acceptance criteria, trace matrix",
  },
  design: {
    trad: "Architecture docs reviewed monthly; diagrams drift from reality.",
    ai: "Architect agent proposes options and ADRs; human gate approves or rejects with feedback.",
    agent: "📐 Solution Architect",
    human: "Architecture Review Board approves (LangGraph interrupt)",
    artefacts: "Component diagram, API contracts, data model, ADRs",
  },
  build: {
    trad: "Developers hand-write everything, including boilerplate; knowledge silos.",
    ai: "Coding agent implements against acceptance criteria and revises on QA feedback.",
    agent: "🛠️ Developer",
    human: "Engineers review PRs and own design trade-offs",
    artefacts: "Code, unit tests, PR description",
  },
  test: {
    trad: "Testing happens late, mostly manual; edge cases missed; environment queues.",
    ai: "Test agent generates plans and cases up front and acts as critic in a reflection loop.",
    agent: "🧪 QA Engineer",
    human: "QA lead curates evaluation sets and exploratory testing",
    artefacts: "Test plan, test cases, defect report, verdict",
  },
  deploy: {
    trad: "Release trains, CAB meetings, manual runbooks.",
    ai: "DevOps agent generates pipelines with canary, auto-rollback and evidence.",
    agent: "🔐 Security + 🚀 DevOps",
    human: "Change approval and security sign-off",
    artefacts: "CI/CD YAML, threat model, readiness checklist",
  },
  operate: {
    trad: "Dashboards and on-call firefighting; incidents found by customers.",
    ai: "Ops agents triage alerts, summarise incidents and propose fixes as PRs.",
    agent: "📡 Ops / SRE agent",
    human: "SRE decides remediation; continuous improvement",
    artefacts: "Incident summaries, RCA drafts, fix PRs",
  },
};

const improvement = (m: { before: number; after: number; lowerIsBetter: boolean }) =>
  Math.round((m.lowerIsBetter ? (m.before - m.after) / m.before : (m.after - m.before) / m.before) * 100);

export default function CompareClient() {
  const [phase, setPhase] = useState<PhaseKey>("requirements");
  const [mode, setMode] = useState<"split" | "trad" | "ai">("split");
  const g = GENERIC[phase];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="font-display text-4xl font-extrabold">
        Traditional SDLC <span className="text-muted">vs</span> <span className="gradient-text">Agentic AI-SDLC</span>
      </h1>
      <p className="mt-2 max-w-3xl text-muted">Click a phase to see how the work, the people and the artefacts change. Below, see the same phase in all 8 verticals and the illustrative impact heatmap.</p>

      {/* Phase timeline */}
      <div className="mt-8 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {PHASES.map((p, i) => (
          <button
            key={p.key}
            onClick={() => setPhase(p.key)}
            className={`relative rounded-2xl p-3 text-center transition ${phase === p.key ? "bg-gradient-to-br from-fuchsia-500 to-cyan-500 shadow-lg shadow-fuchsia-500/30" : "glass hover:bg-white/10"}`}
          >
            <div className="text-2xl">{p.icon}</div>
            <div className="text-xs font-bold">{i + 1}. {p.label}</div>
          </button>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        {(["split", "trad", "ai"] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)} className={`rounded-full px-3 py-1 text-xs font-semibold ${mode === m ? "bg-white/20" : "text-muted hover:bg-white/10"}`}>
            {m === "split" ? "Side by side" : m === "trad" ? "Traditional only" : "AI-SDLC only"}
          </button>
        ))}
      </div>

      <div className={`mt-4 grid gap-4 ${mode === "split" ? "md:grid-cols-2" : ""}`}>
        {mode !== "ai" && (
          <div className="rounded-3xl border border-slate-500/30 bg-slate-800/40 p-6">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-300">Traditional SDLC: relay race</div>
            <p className="mt-3 text-lg">{g.trad}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-slate-600/40 px-3 py-1">👤 Manual hand-offs</span>
              <span className="rounded-full bg-slate-600/40 px-3 py-1">📄 Static documents</span>
              <span className="rounded-full bg-slate-600/40 px-3 py-1">⏳ Late feedback</span>
            </div>
          </div>
        )}
        {mode !== "trad" && (
          <div className="gradient-border rounded-3xl bg-gradient-to-br from-fuchsia-500/15 via-violet-500/10 to-cyan-500/15 p-6">
            <div className="text-xs font-bold uppercase tracking-widest text-fuchsia-200">Agentic AI-SDLC: orchestrated swarm</div>
            <p className="mt-3 text-lg">{g.ai}</p>
            <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
              <div className="rounded-2xl bg-black/20 p-3"><dt className="text-xs text-muted">Agent</dt><dd className="font-semibold">{g.agent}</dd></div>
              <div className="rounded-2xl bg-black/20 p-3"><dt className="text-xs text-muted">Human role</dt><dd className="font-semibold">{g.human}</dd></div>
              <div className="rounded-2xl bg-black/20 p-3"><dt className="text-xs text-muted">Artefacts</dt><dd className="font-semibold">{g.artefacts}</dd></div>
            </dl>
          </div>
        )}
      </div>

      {/* Per-vertical */}
      <h2 className="mt-12 font-display text-2xl font-bold">{PHASES.find((p) => p.key === phase)?.icon} {PHASES.find((p) => p.key === phase)?.label} across verticals</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {VERTICALS.map((v) => (
          <div key={v.id} className="glass overflow-hidden rounded-2xl">
            <div className={`bg-gradient-to-r ${v.gradient} px-4 py-2 text-sm font-bold`}>{v.emoji} {v.name}</div>
            <div className="grid gap-3 p-4 text-sm sm:grid-cols-2">
              <div><div className="text-[11px] font-bold uppercase text-slate-400">Before</div><p className="text-slate-300">{v.traditional[phase]}</p></div>
              <div><div className="text-[11px] font-bold uppercase text-fuchsia-300">With agents</div><p>{v.agentic[phase]}</p></div>
            </div>
          </div>
        ))}
      </div>

      {/* Heatmap */}
      <h2 className="mt-12 font-display text-2xl font-bold">Impact heatmap</h2>
      <p className="text-sm text-muted">Illustrative before → after targets for discussion (not measured benchmarks). Darker = bigger improvement.</p>
      <div className="mt-4 space-y-3">
        {VERTICALS.map((v) => (
          <div key={v.id} className="glass grid items-center gap-3 rounded-2xl p-3 md:grid-cols-[200px_1fr]">
            <div className="font-semibold">{v.emoji} {v.short}</div>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              {v.metrics.map((m) => {
                const imp = improvement(m);
                const a = Math.min(1, Math.abs(imp) / 100) * 0.75 + 0.15;
                return (
                  <div key={m.label} className="rounded-xl p-2.5" style={{ background: `rgba(217, 70, 239, ${a * 0.55})`, boxShadow: `inset 0 0 0 1px ${v.accent}55` }}>
                    <div className="truncate text-[11px] text-white/80" title={m.label}>{m.label}</div>
                    <div className="flex items-baseline justify-between">
                      <span className="font-mono text-xs text-white/70">{m.before}{m.unit} → <b className="text-white">{m.after}{m.unit}</b></span>
                      <span className="text-sm font-extrabold">{imp > 0 ? "+" : ""}{imp}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
