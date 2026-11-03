import Link from "next/link";
import { ArrowRight, BookOpen, FlaskConical, Bot, CalendarClock, GitCompareArrows } from "lucide-react";
import { VERTICALS } from "@/lib/verticals";
import { MODULES, SESSION } from "@/lib/curriculum";

const CARDS = [
  { href: "/learn", title: "Learning Path", desc: "8 modules from SDLC basics to LangGraph, with quizzes and facilitator notes.", icon: BookOpen, g: "from-fuchsia-500 to-violet-600" },
  { href: "/compare", title: "SDLC vs AI-SDLC", desc: "Interactive phase-by-phase comparison and an impact heatmap across verticals.", icon: GitCompareArrows, g: "from-cyan-500 to-blue-600" },
  { href: "/labs", title: "Hands-on Labs", desc: "Run an 8-agent LangGraph pipeline from requirements to production on your own Groq key.", icon: FlaskConical, g: "from-lime-500 to-emerald-600" },
  { href: "/assistant", title: "AI Assistant", desc: "A LangGraph ReAct tutor with tools. Ask in English or Español.", icon: Bot, g: "from-amber-500 to-rose-600" },
  { href: "/agenda", title: "2-Hour Agenda", desc: "Facilitator run-sheet with live session timer.", icon: CalendarClock, g: "from-pink-500 to-fuchsia-600" },
];

const PIPE = [
  ["📝", "Requirements"], ["📐", "Architect"], ["🙋", "Human gate"], ["🛠️", "Developer"],
  ["🧪", "QA"], ["🔐", "Security"], ["🚀", "DevOps"], ["📊", "Impact"],
];

export default function Home() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-16">
      {/* Hero */}
      <section className="pt-14 text-center sm:pt-20">
        <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-fuchsia-200">
          🇲🇽 {SESSION.audience} · {SESSION.duration}
        </span>
        <h1 className="mx-auto mt-6 max-w-4xl font-display text-4xl font-extrabold leading-[1.05] sm:text-6xl lg:text-7xl">
          <span className="gradient-text">{SESSION.title}</span>
          <br />
          <span className="text-white">{SESSION.subtitle}</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">
          Learn how AI agents are changing every phase of software delivery, then build that change yourself with a
          multi-agent <b className="text-white">LangGraph</b> pipeline running on <b className="text-white">Groq</b>, across{" "}
          <b className="text-white">{VERTICALS.length} business verticals</b>.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/labs" className="flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-500 px-6 py-3 font-bold shadow-xl shadow-fuchsia-500/30 hover:brightness-110">
            Start the hands-on lab <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/learn" className="glass flex items-center gap-2 rounded-full px-6 py-3 font-semibold hover:bg-white/10">
            Open learning path
          </Link>
        </div>

        {/* pipeline strip */}
        <div className="glass mx-auto mt-12 max-w-5xl overflow-x-auto rounded-3xl p-4">
          <div className="flex min-w-max items-center justify-center gap-2">
            {PIPE.map(([e, l], i) => (
              <div key={l} className="flex items-center gap-2">
                <div className={`flex flex-col items-center rounded-2xl px-3 py-2 ${l === "Human gate" ? "bg-amber-500/15 ring-1 ring-amber-400/40" : "bg-white/5"}`}>
                  <span className="text-2xl">{e}</span>
                  <span className="mt-1 text-[11px] font-semibold text-muted">{l}</span>
                </div>
                {i < PIPE.length - 1 && <span className="text-fuchsia-300">→</span>}
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">The lab&apos;s LangGraph state machine, with a human approval gate (interrupt) and a QA ⇄ Developer reflection loop</p>
        </div>
      </section>

      {/* Cards */}
      <section className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {CARDS.map((c) => (
          <Link key={c.href} href={c.href} className="glass group rounded-3xl p-5 transition hover:-translate-y-1 hover:bg-white/10">
            <div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${c.g} shadow-lg`}>
              <c.icon className="h-6 w-6" />
            </div>
            <h3 className="mt-4 font-display text-lg font-bold">{c.title}</h3>
            <p className="mt-1 text-sm text-muted">{c.desc}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-fuchsia-200 group-hover:gap-2">Open <ArrowRight className="h-4 w-4" /></span>
          </Link>
        ))}
      </section>

      {/* Verticals */}
      <section className="mt-16">
        <h2 className="font-display text-3xl font-extrabold">8 verticals, one agentic pipeline</h2>
        <p className="mt-1 text-muted">Each squad picks a vertical. Every scenario is grounded in Mexico & US-nearshore realities (SPEI, CFDI 4.0, Carta Porte, USMCA/T-MEC, HIPAA…).</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {VERTICALS.map((v) => (
            <Link key={v.id} href={`/labs?v=${v.id}`} className="group relative overflow-hidden rounded-3xl p-[1px] transition hover:-translate-y-1">
              <div className={`absolute inset-0 bg-gradient-to-br ${v.gradient} opacity-70 group-hover:opacity-100`} />
              <div className="relative h-full rounded-[calc(1.5rem-1px)] bg-[#0d0b27]/85 p-5">
                <div className="text-4xl">{v.emoji}</div>
                <h3 className="mt-3 font-display text-lg font-bold">{v.name}</h3>
                <p className="text-sm text-muted">{v.tagline}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Agenda strip */}
      <section className="mt-16">
        <h2 className="font-display text-3xl font-extrabold">The 2-hour journey</h2>
        <div className="mt-6 flex h-14 w-full overflow-hidden rounded-2xl">
          {MODULES.map((m) => (
            <Link
              key={m.id}
              href={`/learn#${m.id}`}
              style={{ flexGrow: m.minutes }}
              className={`group flex items-center justify-center bg-gradient-to-br ${m.color} px-1 text-center text-[11px] font-bold transition hover:brightness-125`}
              title={`${m.start} · ${m.title} (${m.minutes} min)`}
            >
              <span className="truncate">{m.emoji} <span className="hidden md:inline">{m.minutes}′</span></span>
            </Link>
          ))}
        </div>
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
          {MODULES.map((m) => (
            <div key={m.id} className="flex gap-2 text-muted"><span className="font-mono text-fuchsia-200">{m.start}</span> {m.title}</div>
          ))}
        </div>
      </section>
    </div>
  );
}
