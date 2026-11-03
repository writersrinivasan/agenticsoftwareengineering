"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { KeyRound, CheckCircle2, XCircle, Loader2, ShieldCheck, Eye, EyeOff, Trash2, X } from "lucide-react";

const DEFAULT_MODEL = "llama-3.3-70b-versatile";
const FALLBACK_MODELS = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "openai/gpt-oss-120b", "openai/gpt-oss-20b"];
const K = { key: "ase.groqKey", model: "ase.groqModel", remember: "ase.remember" };

interface Ctx {
  apiKey: string;
  model: string;
  ready: boolean;
  headers: Record<string, string>;
  openDialog: () => void;
}
const GroqCtx = createContext<Ctx | null>(null);
export const useGroq = () => {
  const c = useContext(GroqCtx);
  if (!c) throw new Error("useGroq must be inside GroqKeyProvider");
  return c;
};

const safe = {
  get(store: "local" | "session", k: string) {
    try { return (store === "local" ? localStorage : sessionStorage).getItem(k) ?? ""; } catch { return ""; }
  },
  set(store: "local" | "session", k: string, v: string) {
    try { (store === "local" ? localStorage : sessionStorage).setItem(k, v); } catch {}
  },
  del(k: string) {
    try { localStorage.removeItem(k); sessionStorage.removeItem(k); } catch {}
  },
};

export default function GroqKeyProvider({ children }: { children: React.ReactNode }) {
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const k = safe.get("session", K.key) || safe.get("local", K.key);
    const m = safe.get("local", K.model);
    if (k) setApiKey(k);
    if (m) setModel(m);
  }, []);

  const save = useCallback((k: string, m: string, remember: boolean) => {
    safe.del(K.key);
    if (k) safe.set(remember ? "local" : "session", K.key, k);
    safe.set("local", K.model, m);
    safe.set("local", K.remember, remember ? "1" : "0");
    setApiKey(k);
    setModel(m);
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      apiKey,
      model,
      ready: apiKey.length > 10,
      headers: (apiKey ? { "x-groq-key": apiKey } : {}) as Record<string, string>,
      openDialog: () => setOpen(true),
    }),
    [apiKey, model]
  );

  return (
    <GroqCtx.Provider value={value}>
      {children}
      {open && <KeyDialog initialKey={apiKey} initialModel={model} onClose={() => setOpen(false)} onSave={save} />}
    </GroqCtx.Provider>
  );
}

function KeyDialog({
  initialKey, initialModel, onClose, onSave,
}: {
  initialKey: string; initialModel: string; onClose: () => void; onSave: (k: string, m: string, r: boolean) => void;
}) {
  const [key, setKey] = useState(initialKey);
  const [model, setModel] = useState(initialModel);
  const [remember, setRemember] = useState(() => safe.get("local", K.remember) === "1");
  const [show, setShow] = useState(false);
  const [models, setModels] = useState<string[]>(FALLBACK_MODELS);
  const [status, setStatus] = useState<{ s: "idle" | "testing" | "ok" | "err"; msg?: string }>({ s: "idle" });

  const test = async () => {
    setStatus({ s: "testing" });
    try {
      const r = await fetch("/api/models", { headers: { "x-groq-key": key.trim() } });
      const d = await r.json();
      if (!d.ok) throw new Error(d.error);
      setModels(d.models.length ? d.models : FALLBACK_MODELS);
      if (d.models.length && !d.models.includes(model)) setModel(d.models.includes(DEFAULT_MODEL) ? DEFAULT_MODEL : d.models[0]);
      setStatus({ s: "ok", msg: `Key works. ${d.models.length} chat models available.` });
    } catch (e) {
      setStatus({ s: "err", msg: (e as Error).message });
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="glass gradient-border w-full max-w-lg rounded-3xl bg-[#120f33]/90 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-cyan-500">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold">Bring Your Own Key</h2>
              <p className="text-sm text-muted">Groq API key that powers the LangGraph agents</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-muted hover:bg-white/10" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>

        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">Groq API key</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type={show ? "text" : "password"}
              value={key}
              onChange={(e) => { setKey(e.target.value); setStatus({ s: "idle" }); }}
              placeholder="gsk_…"
              autoComplete="off"
              spellCheck={false}
              className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 pr-10 font-mono text-sm outline-none focus:border-fuchsia-400"
            />
            <button onClick={() => setShow(!show)} className="absolute right-2 top-2.5 text-muted hover:text-white" aria-label="Toggle visibility">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <button
            onClick={test}
            disabled={key.trim().length < 10 || status.s === "testing"}
            className="rounded-xl bg-white/10 px-4 text-sm font-semibold hover:bg-white/20 disabled:opacity-40"
          >
            {status.s === "testing" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test"}
          </button>
        </div>
        <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-cyan-300 underline underline-offset-2">
          Get a free key at console.groq.com/keys →
        </a>
        {status.s === "ok" && <p className="mt-2 flex items-center gap-1.5 text-sm text-emerald-300"><CheckCircle2 className="h-4 w-4" /> {status.msg}</p>}
        {status.s === "err" && <p className="mt-2 flex items-center gap-1.5 text-sm text-rose-300"><XCircle className="h-4 w-4" /> {status.msg}</p>}

        <label className="mb-1 mt-4 block text-xs font-semibold uppercase tracking-wider text-muted">Model</label>
        <select value={model} onChange={(e) => setModel(e.target.value)} className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-fuchsia-400">
          {[...new Set([model, ...models])].map((m) => <option key={m} value={m} className="bg-[#120f33]">{m}</option>)}
        </select>
        <p className="mt-1 text-xs text-muted">Tip: use a smaller, faster model (e.g. llama-3.1-8b-instant) if you hit free-tier rate limits.</p>

        <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 accent-fuchsia-500" />
          Remember on this device (otherwise it&apos;s cleared when the tab closes)
        </label>

        <div className="mt-4 flex items-start gap-2 rounded-2xl bg-emerald-500/10 p-3 text-xs text-emerald-100">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
          <span>Your key stays in your browser. It&apos;s sent only in a request header to this app&apos;s API routes, which use it for that one call to Groq. It is never logged, saved on the server or put in LangGraph state.</span>
        </div>

        <div className="mt-5 flex justify-between gap-2">
          <button onClick={() => { onSave("", model, false); setKey(""); setStatus({ s: "idle" }); }} className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-rose-300 hover:bg-rose-500/10">
            <Trash2 className="h-4 w-4" /> Forget key
          </button>
          <button
            onClick={() => { onSave(key.trim(), model, remember); onClose(); }}
            className="rounded-xl bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-500 px-5 py-2 text-sm font-bold shadow-lg shadow-fuchsia-500/20 hover:brightness-110"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
