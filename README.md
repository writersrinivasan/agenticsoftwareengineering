# Agentic Software Engineering: From Requirements to Production

A 2-hour learning + hands-on lab app for **Hexaware Americas (Mexico team)**.
Built with **Next.js 16**, **LangGraph JS** (agentic framework) and **Groq** (BYOK: bring your own key).

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
# or for the session:
npm run build && npm start
```

Each participant clicks **🔑 Add Groq key** (top right), pastes a key from <https://console.groq.com/keys>, presses **Test** and picks a model.
No `.env` file is needed. The key stays in the browser (session storage by default, or local storage if "Remember" is ticked) and is sent per request in an `x-groq-key` header. It is never logged, stored on the server or put in LangGraph state.

## What's inside

| Page | Purpose |
|---|---|
| `/` | Session overview, 8 verticals, 2-hour journey |
| `/learn` | 8 modules (welcome → SDLC vs AI-SDLC → agent anatomy → LangGraph → pipeline → lab → governance → wrap-up), quizzes, facilitator notes, progress |
| `/compare` | Phase-by-phase Traditional SDLC vs AI-SDLC, per-vertical view, impact heatmap |
| `/labs` | **Hands-on:** run the 8-agent LangGraph pipeline per vertical, with a live graph, token streaming, human-in-the-loop gate, reflection loop, version diffs (v1/v2), trace and Markdown export |
| `/assistant` | "Agente ASE": a LangGraph ReAct agent (agent ⇄ tools) with tools over the course content. EN/ES |
| `/agenda` | Facilitator run-sheet with a live session timer |

### Verticals (8)
Banking & FinTech (SPEI fraud scoring) · Healthcare (telemedicine + FHIR) · Retail (omnichannel + CFDI 4.0) · Manufacturing (predictive maintenance, Monterrey) · Insurance (FNOL claims) · Telecom (churn/retention offers) · Logistics (cross-border Carta Porte, USMCA/T-MEC) · Energy (smart-meter billing anomalies).

### The LangGraph pipeline (`src/lib/agents/pipeline.ts`)

```
START → Requirements → Architect → [Human Review gate: interrupt()] → Developer → QA ─PASS→ Security → DevOps → Impact → END
                          ↑            │ reject                        ↑         │
                          └────────────┘ (max 3 rounds)                └── FAIL ─┘ (max 2 iterations)
```

* **State** with reducers (`Annotation.Root`), **conditional edges** for loops, **MemorySaver** checkpointer, **`interrupt()` / `Command({ resume })`** for human-in-the-loop.
* Streaming via `graph.stream(..., { streamMode: ["updates", "messages", "custom"] })` → NDJSON → browser.
* Lab toggles: **Español output**, **Architecture Review gate (HITL)**, **Force reflection loop** (makes QA fail round 1 so the cycle is visible).

### Key files
```
src/lib/verticals.ts         scenarios, traditional vs agentic per phase, illustrative metrics, exercises
src/lib/curriculum.ts        module content + quizzes + facilitator notes
src/lib/agents/pipeline.ts   multi-agent SDLC StateGraph
src/lib/agents/assistant.ts  ReAct tutor agent with tools
src/app/api/*                route handlers (models check, pipeline stream, assistant stream)
```

## Notes for facilitators
* **Rate limits:** Groq free tier has tokens-per-minute limits. A full pipeline run makes 8–12 LLM calls. If you hit a 429, switch to `llama-3.1-8b-instant` in the key dialog or wait a minute.
* **Human-in-the-loop** uses an in-memory checkpointer, so run the app as one Node process (`npm run dev` / `npm start`). On multi-instance serverless hosting, replace `MemorySaver` with a persistent checkpointer (e.g. Postgres) before relying on the gate.
* Impact metrics in the app are **illustrative discussion targets**, not measured benchmarks.
