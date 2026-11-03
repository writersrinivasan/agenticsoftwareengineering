"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { KeyRound, Menu, X, Sparkles } from "lucide-react";
import { useGroq } from "./GroqKeyProvider";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/learn", label: "Learn" },
  { href: "/compare", label: "SDLC vs AI-SDLC" },
  { href: "/labs", label: "Hands-on Labs" },
  { href: "/assistant", label: "AI Assistant" },
  { href: "/agenda", label: "Agenda" },
];

export default function Nav() {
  const path = usePathname();
  const { ready, model, openDialog } = useGroq();
  const [open, setOpen] = useState(false);
  const active = (h: string) => (h === "/" ? path === "/" : path.startsWith(h));

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07061a]/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-500 via-violet-500 to-cyan-400 shadow-lg shadow-fuchsia-500/30">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="hidden font-display text-lg font-extrabold leading-none sm:block">
            Agentic<span className="gradient-text">SE</span> Lab
          </span>
        </Link>
        <nav className="ml-4 hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${active(l.href) ? "bg-white/15 text-white" : "text-muted hover:bg-white/5 hover:text-white"}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={openDialog}
            className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${ready ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20" : "animate-pulse border-amber-400/50 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25"}`}
            title={ready ? `Model: ${model}` : "Add your Groq API key"}
          >
            <KeyRound className="h-4 w-4" />
            <span className="hidden sm:inline">{ready ? "Groq key ✓" : "Add Groq key"}</span>
          </button>
          <button className="rounded-lg p-2 hover:bg-white/10 lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="flex flex-col gap-1 border-t border-white/10 px-4 py-3 lg:hidden">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className={`rounded-xl px-3 py-2 text-sm ${active(l.href) ? "bg-white/15" : "text-muted"}`}>
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
