"use client";
import { useState } from "react";
import type { QuizQ } from "@/lib/curriculum";

export default function Quiz({ items }: { items: QuizQ[] }) {
  const [picked, setPicked] = useState<Record<number, number>>({});
  if (!items.length) return null;
  const score = items.filter((q, i) => picked[i] === q.answer).length;
  return (
    <div className="glass mt-8 rounded-3xl p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-bold">🎯 Quick check</h3>
        {Object.keys(picked).length === items.length && (
          <span className="rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 px-3 py-1 text-xs font-bold">
            {score}/{items.length} correct {score === items.length ? "🎉" : ""}
          </span>
        )}
      </div>
      {items.map((q, i) => (
        <div key={i} className="mt-4">
          <p className="font-semibold">{i + 1}. {q.q}</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {q.options.map((o, j) => {
              const chosen = picked[i] === j;
              const done = picked[i] !== undefined;
              const right = j === q.answer;
              return (
                <button
                  key={j}
                  disabled={done}
                  onClick={() => setPicked({ ...picked, [i]: j })}
                  className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                    done && right ? "border-emerald-400 bg-emerald-500/15" : done && chosen ? "border-rose-400 bg-rose-500/15" : "border-white/10 bg-white/5 hover:border-fuchsia-400/60 hover:bg-white/10"
                  }`}
                >
                  {o}
                </button>
              );
            })}
          </div>
          {picked[i] !== undefined && <p className="mt-2 text-sm text-cyan-100">💡 {q.why}</p>}
        </div>
      ))}
      <button onClick={() => setPicked({})} className="mt-4 text-xs text-muted underline">Reset quiz</button>
    </div>
  );
}
