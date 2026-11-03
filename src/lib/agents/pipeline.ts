import "server-only";
import { StateGraph, Annotation, START, END, MemorySaver, interrupt } from "@langchain/langgraph";
import type { LangGraphRunnableConfig } from "@langchain/langgraph";
import type { ChatGroq } from "@langchain/groq";
import { getVertical, type Vertical } from "@/lib/verticals";
import { textOf } from "@/lib/groq";

/* ───────────────────────── State ───────────────────────── */

export interface HistoryItem {
  node: string;
  round: number;
  content: string;
}

export const SDLCState = Annotation.Root({
  verticalId: Annotation<string>(),
  requirement: Annotation<string>(),
  language: Annotation<string>(),
  hitl: Annotation<boolean>(),
  forceReflection: Annotation<boolean>(),
  // latest artefact per agent
  artifacts: Annotation<Record<string, string>>({ reducer: (a, b) => ({ ...a, ...b }), default: () => ({}) }),
  // every version produced (so you can compare v1 vs v2)
  history: Annotation<HistoryItem[]>({ reducer: (a, b) => a.concat(b), default: () => [] }),
  devRound: Annotation<number>({ reducer: (_a, b) => b, default: () => 0 }),
  archRound: Annotation<number>({ reducer: (_a, b) => b, default: () => 0 }),
  qaVerdict: Annotation<"PASS" | "FAIL" | "">({ reducer: (_a, b) => b, default: () => "" }),
  approved: Annotation<boolean>({ reducer: (_a, b) => b, default: () => false }),
  reviewFeedback: Annotation<string>({ reducer: (_a, b) => b, default: () => "" }),
});

export type SDLCStateT = typeof SDLCState.State;

export const MAX_DEV_ROUNDS = 2;
export const MAX_ARCH_ROUNDS = 3;

/* ───────────────────────── Helpers ───────────────────────── */

const clip = (s: string | undefined, n = 2200) => {
  if (!s) return "(not available)";
  return s.length > n ? s.slice(0, n) + "\n…[truncated for context budget]" : s;
};

function context(v: Vertical, s: SDLCStateT) {
  return `INDUSTRY: ${v.name}
CLIENT: ${v.client}
COMPLIANCE / STANDARDS: ${v.compliance.join("; ")}
BUSINESS REQUIREMENT:
"""
${s.requirement}
"""`;
}

const lang = (s: SDLCStateT) =>
  `Write your entire answer in ${s.language || "English"} (keep code, identifiers and the literal word VERDICT in English). Use GitHub-flavoured Markdown with short headings. Be concise and concrete for this industry.`;

type LLMFactory = (maxTokens?: number) => ChatGroq;

function announce(config: LangGraphRunnableConfig, node: string, extra: Record<string, unknown> = {}) {
  config.writer?.({ type: "node_start", node, ...extra });
}

/* ───────────────────────── Graph ───────────────────────── */

export function buildPipeline(llm: LLMFactory, checkpointer: MemorySaver) {
  const ask = async (system: string, user: string, maxTokens?: number) => {
    const res = await llm(maxTokens).invoke([
      ["system", system],
      ["user", user],
    ]);
    return textOf(res.content).trim();
  };

  // 1️⃣ Requirements Analyst
  const requirementsAnalyst = async (s: SDLCStateT, config: LangGraphRunnableConfig) => {
    announce(config, "requirements_analyst");
    const v = getVertical(s.verticalId)!;
    const out = await ask(
      `You are a senior Business Analyst / Product Owner agent in an agentic SDLC. ${lang(s)}`,
      `${context(v, s)}

Produce:
1. **Epic** (1 line) and **personas**
2. **User stories** (4–6) in "As a … I want … so that …" form
3. **Acceptance criteria** in Gherkin (Given/When/Then) for the 3 most important stories
4. **Non-functional requirements** (performance, availability, security, privacy)
5. **Compliance trace**: a small table mapping each compliance item to the story/NFR covering it
6. **Open questions** for human stakeholders (max 3)`
    );
    return { artifacts: { requirements_analyst: out }, history: [{ node: "requirements_analyst", round: 1, content: out }] };
  };

  // 2️⃣ Solution Architect
  const architect = async (s: SDLCStateT, config: LangGraphRunnableConfig) => {
    const round = s.archRound + 1;
    announce(config, "architect", { round });
    const v = getVertical(s.verticalId)!;
    const feedback =
      s.reviewFeedback && round > 1
        ? `\n\nThe Architecture Review Board REJECTED your previous design with this feedback. Address every point explicitly in a "Changes from v${round - 1}" section at the top:\n"""${s.reviewFeedback}"""\n\nPrevious design:\n${clip(s.artifacts.architect, 1500)}`
        : "";
    const out = await ask(
      `You are a principal Solution Architect agent. You design pragmatic, cloud-native, secure architectures. ${lang(s)}`,
      `${context(v, s)}

REQUIREMENTS ANALYST OUTPUT:
${clip(s.artifacts.requirements_analyst)}
${feedback}

Produce (design v${round}):
1. **Architecture overview**: components and responsibilities (a bullet list plus a simple ASCII or mermaid diagram in a code block)
2. **Key API contract**: 2–4 endpoints or events with request/response shape
3. **Data model**: main entities
4. **Architecture Decision Records**: 2–3 ADRs (decision, alternatives, rationale)
5. **How NFRs and compliance are met**`,
      1400
    );
    return {
      artifacts: { architect: out },
      archRound: round,
      history: [{ node: "architect", round, content: out }],
    };
  };

  // 3️⃣ Human-in-the-loop Architecture Review gate
  const reviewGate = async (s: SDLCStateT, config: LangGraphRunnableConfig) => {
    announce(config, "review_gate", { round: s.archRound });
    const decision = interrupt({
      kind: "architecture_review",
      round: s.archRound,
      design: s.artifacts.architect,
    }) as { approved: boolean; feedback?: string };
    const approved = !!decision?.approved;
    return {
      approved,
      reviewFeedback: decision?.feedback ?? "",
      history: [
        {
          node: "review_gate",
          round: s.archRound,
          content: approved
            ? `✅ **Approved** design v${s.archRound}${decision?.feedback ? `, with note: ${decision.feedback}` : ""}`
            : `❌ **Rejected** design v${s.archRound}: ${decision?.feedback || "(no feedback)"}`,
        },
      ],
    };
  };

  // 4️⃣ Developer
  const developer = async (s: SDLCStateT, config: LangGraphRunnableConfig) => {
    const round = s.devRound + 1;
    announce(config, "developer", { round });
    const v = getVertical(s.verticalId)!;
    const fix =
      round > 1
        ? `\n\nThe QA agent REJECTED your previous implementation. Fix every defect it found, and start with a "Fixes applied in iteration ${round}" checklist.\nQA REPORT:\n${clip(s.artifacts.qa_engineer, 1600)}\n\nPREVIOUS CODE:\n${clip(s.artifacts.developer, 2000)}`
        : "";
    const out = await ask(
      `You are a senior Software Engineer agent. Write clean, production-quality, well-structured TypeScript (Node.js) code with validation, error handling and logging. Never invent real credentials. ${lang(s)}`,
      `${context(v, s)}

USER STORIES & ACCEPTANCE CRITERIA:
${clip(s.artifacts.requirements_analyst, 1800)}

ARCHITECTURE:
${clip(s.artifacts.architect, 1800)}
${fix}

Implement the **core module(s)** of this system (iteration ${round}):
- Short file tree
- The most important code (one or two files, ~80–150 lines total), including domain logic and input validation
- 2–3 unit tests (Vitest/Jest style)
- Notes on what's stubbed and why`,
      1800
    );
    return { artifacts: { developer: out }, devRound: round, history: [{ node: "developer", round, content: out }] };
  };

  // 5️⃣ QA Engineer, the critic in the reflection loop
  const qaEngineer = async (s: SDLCStateT, config: LangGraphRunnableConfig) => {
    announce(config, "qa_engineer", { round: s.devRound });
    const v = getVertical(s.verticalId)!;
    const strict =
      s.forceReflection && s.devRound === 1
        ? "\nIMPORTANT: This is the FIRST review round of a strict quality gate. Identify the 2–3 most important real defects or gaps (missing validation, unhandled edge cases, compliance gaps, missing tests) and you MUST return VERDICT: FAIL."
        : "\nBe fair. Return FAIL only for significant defects that violate acceptance criteria, security or compliance; otherwise PASS.";
    const out = await ask(
      `You are a meticulous QA / Test Engineer agent and the critic in a reflection loop. ${lang(s)}`,
      `${context(v, s)}

ACCEPTANCE CRITERIA:
${clip(s.artifacts.requirements_analyst, 1500)}

IMPLEMENTATION (iteration ${s.devRound}):
${clip(s.artifacts.developer, 2600)}
${strict}

Produce:
1. **Test plan** (unit, integration, contract, performance, security)
2. **Test cases table**: ID | scenario | type | expected result (6–8 rows, including industry-specific edge cases)
3. **Defects found** (severity + description + suggested fix), or "None"
4. Last line exactly: VERDICT: PASS  or  VERDICT: FAIL`,
      1300
    );
    const m = out.match(/VERDICT:\s*\**\s*(PASS|FAIL)/i);
    const verdict = (m?.[1]?.toUpperCase() as "PASS" | "FAIL") ?? "PASS";
    return {
      artifacts: { qa_engineer: out },
      qaVerdict: verdict,
      history: [{ node: "qa_engineer", round: s.devRound, content: out }],
    };
  };

  // 6️⃣ Security & Compliance
  const security = async (s: SDLCStateT, config: LangGraphRunnableConfig) => {
    announce(config, "security_compliance");
    const v = getVertical(s.verticalId)!;
    const out = await ask(
      `You are an Application Security & Compliance agent (OWASP, STRIDE, OWASP Top 10 for LLM apps, industry regulation). ${lang(s)}`,
      `${context(v, s)}

ARCHITECTURE:
${clip(s.artifacts.architect, 1600)}

CODE:
${clip(s.artifacts.developer, 1600)}

Produce:
1. **STRIDE threat model** table (threat | component | mitigation), 5–6 rows
2. **Compliance checklist** for: ${v.compliance.join(", ")} (status: ✅ covered / ⚠️ partial / ❌ gap)
3. **Data protection**: PII/sensitive data flows and how they're protected
4. **Required human sign-offs** before production`
    );
    return { artifacts: { security_compliance: out }, history: [{ node: "security_compliance", round: 1, content: out }] };
  };

  // 7️⃣ DevOps / SRE
  const devops = async (s: SDLCStateT, config: LangGraphRunnableConfig) => {
    announce(config, "devops");
    const v = getVertical(s.verticalId)!;
    const out = await ask(
      `You are a DevOps / SRE agent focused on safe, automated delivery to production. ${lang(s)}`,
      `${context(v, s)}

ARCHITECTURE:
${clip(s.artifacts.architect, 1500)}

SECURITY NOTES:
${clip(s.artifacts.security_compliance, 800)}

Produce:
1. **CI/CD pipeline** as a GitHub Actions YAML (build, test, SAST, container scan, deploy to staging, manual approval, canary to prod)
2. **Rollout & rollback strategy** suitable for this industry
3. **Observability**: 4–5 SLIs/SLOs and alerts
4. **Production readiness checklist** (6 items)`,
      1400
    );
    return { artifacts: { devops: out }, history: [{ node: "devops", round: 1, content: out }] };
  };

  // 8️⃣ Impact Analyst
  const impact = async (s: SDLCStateT, config: LangGraphRunnableConfig) => {
    announce(config, "impact_analyst");
    const v = getVertical(s.verticalId)!;
    const run = `Pipeline facts: architecture rounds = ${s.archRound}, developer iterations = ${s.devRound}, final QA verdict = ${s.qaVerdict || "n/a"}, human review gate = ${s.hitl ? "ON" : "OFF"}.`;
    const out = await ask(
      `You are a Delivery Excellence / Value Engineering agent at an IT services company. Be realistic. Label all numbers as estimates. ${lang(s)}`,
      `${context(v, s)}
${run}

Summaries of what the agents produced:
- Requirements: ${clip(s.artifacts.requirements_analyst, 500)}
- Architecture: ${clip(s.artifacts.architect, 500)}
- QA: ${clip(s.artifacts.qa_engineer, 400)}
- Security: ${clip(s.artifacts.security_compliance, 400)}

Produce an executive impact report:
1. **Traditional SDLC vs Agentic AI-SDLC** table by phase (Requirements, Design, Build, Test, Deploy, Operate): traditional effort/time vs agentic effort/time (estimates)
2. **Business impact** for ${v.name}: 3–4 bullets (time-to-market, quality, compliance, cost)
3. **Risks & where humans must stay in the loop** (3 bullets)
4. **KPIs to track** (DORA + 2 industry KPIs)
5. One-paragraph **executive summary**`,
      1300
    );
    return { artifacts: { impact_analyst: out }, history: [{ node: "impact_analyst", round: 1, content: out }] };
  };

  return new StateGraph(SDLCState)
    .addNode("requirements_analyst", requirementsAnalyst)
    .addNode("architect", architect)
    .addNode("review_gate", reviewGate)
    .addNode("developer", developer)
    .addNode("qa_engineer", qaEngineer)
    .addNode("security_compliance", security)
    .addNode("devops", devops)
    .addNode("impact_analyst", impact)
    .addEdge(START, "requirements_analyst")
    .addEdge("requirements_analyst", "architect")
    .addConditionalEdges("architect", (s) => (s.hitl ? "review_gate" : "developer"), ["review_gate", "developer"])
    .addConditionalEdges(
      "review_gate",
      (s) => (s.approved || s.archRound >= MAX_ARCH_ROUNDS ? "developer" : "architect"),
      ["developer", "architect"]
    )
    .addEdge("developer", "qa_engineer")
    .addConditionalEdges(
      "qa_engineer",
      (s) => (s.qaVerdict === "FAIL" && s.devRound < MAX_DEV_ROUNDS ? "developer" : "security_compliance"),
      ["developer", "security_compliance"]
    )
    .addEdge("security_compliance", "devops")
    .addEdge("devops", "impact_analyst")
    .addEdge("impact_analyst", END)
    .compile({ checkpointer });
}

/** One in-memory checkpointer per server process (enables interrupt/resume across requests). */
const g = globalThis as unknown as { __aseCheckpointer?: MemorySaver };
export const checkpointer = (g.__aseCheckpointer ??= new MemorySaver());
