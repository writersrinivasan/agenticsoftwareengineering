import "server-only";
import { StateGraph, MessagesAnnotation, START, END } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { tool } from "@langchain/core/tools";
import { AIMessage, SystemMessage } from "@langchain/core/messages";
import type { ChatGroq } from "@langchain/groq";
import { z } from "zod";
import { VERTICALS, PHASES, getVertical, type PhaseKey } from "@/lib/verticals";
import { MODULES } from "@/lib/curriculum";

/* ───────────── Tools the tutor agent can call (ReAct) ───────────── */

const listVerticals = tool(
  async () => VERTICALS.map((v) => `${v.id}: ${v.name}, ${v.tagline}`).join("\n"),
  { name: "list_verticals", description: "List the business verticals covered in the hands-on lab.", schema: z.object({}) }
);

const getVerticalTool = tool(
  async ({ id }) => {
    const v = getVertical(id.toLowerCase()) ?? VERTICALS.find((x) => x.name.toLowerCase().includes(id.toLowerCase()));
    if (!v) return `Unknown vertical "${id}". Valid ids: ${VERTICALS.map((x) => x.id).join(", ")}`;
    return JSON.stringify({
      name: v.name, client: v.client, requirement: v.requirement, compliance: v.compliance,
      traditional: v.traditional, agentic: v.agentic,
      illustrativeMetrics: v.metrics, exercises: v.exercises,
    });
  },
  {
    name: "get_vertical",
    description: "Get the lab scenario for one vertical: requirement, compliance, traditional vs agentic SDLC per phase, illustrative metrics, exercises.",
    schema: z.object({ id: z.string().describe("Vertical id, e.g. banking, healthcare, retail, manufacturing, insurance, telecom, logistics, energy") }),
  }
);

const getModule = tool(
  async ({ topic }) => {
    const t = topic.toLowerCase();
    const m =
      MODULES.find((x) => x.id === t) ??
      MODULES.find((x) => x.title.toLowerCase().includes(t)) ??
      MODULES.find((x) => x.body.toLowerCase().includes(t));
    if (!m) return `No module found for "${topic}". Modules: ${MODULES.map((x) => `${x.id} (${x.title})`).join(", ")}`;
    return `# ${m.title} (${m.minutes} min)\n${m.body.slice(0, 3500)}`;
  },
  {
    name: "get_module",
    description: "Look up session learning content by module id (welcome, sdlc, anatomy, langgraph, pipeline, lab, governance, wrap) or keyword.",
    schema: z.object({ topic: z.string().describe("Module id or keyword") }),
  }
);

const comparePhase = tool(
  async ({ phase }) => {
    const p = PHASES.find((x) => x.key === phase.toLowerCase() || x.label.toLowerCase() === phase.toLowerCase());
    if (!p) return `Unknown phase. Use one of: ${PHASES.map((x) => x.key).join(", ")}`;
    return VERTICALS.map(
      (v) => `## ${v.name}\n- Traditional: ${v.traditional[p.key as PhaseKey]}\n- Agentic: ${v.agentic[p.key as PhaseKey]}`
    ).join("\n");
  },
  {
    name: "compare_sdlc_phase",
    description: "Compare traditional SDLC vs agentic AI-SDLC for one phase across all verticals.",
    schema: z.object({ phase: z.string().describe("requirements | design | build | test | deploy | operate") }),
  }
);

export const assistantTools = [listVerticals, getVerticalTool, getModule, comparePhase];

const SYSTEM = `You are "Agente ASE", a friendly, expert tutor for a 2-hour Hexaware Americas (Mexico team) session called "Agentic Software Engineering: From Requirements to Production".
- Answer in the same language the user writes in (English or Spanish).
- Use your tools to ground answers about the session's modules, the lab's business verticals and SDLC phase comparisons.
- When showing LangGraph code, use TypeScript with @langchain/langgraph (StateGraph, Annotation, conditional edges, interrupt, MemorySaver) and @langchain/groq ChatGroq.
- Be practical, concise, and use Markdown (headings, bullets, tables, code blocks). Be honest about limits and risks of AI agents.`;

/* ───────────── ReAct graph: agent ⇄ tools ───────────── */

export function buildAssistant(llm: ChatGroq) {
  const withTools = llm.bindTools(assistantTools);

  const agent = async (state: typeof MessagesAnnotation.State) => {
    const msgs = [new SystemMessage(SYSTEM), ...state.messages];
    try {
      return { messages: [await withTools.invoke(msgs)] };
    } catch (err) {
      // Some models occasionally emit malformed tool calls: fall back to a plain answer.
      if (/tool|function/i.test(String((err as Error)?.message))) {
        const res = await llm.invoke(msgs);
        return { messages: [res] };
      }
      throw err;
    }
  };

  const route = (state: typeof MessagesAnnotation.State) => {
    const last = state.messages.at(-1) as AIMessage;
    return last?.tool_calls?.length ? "tools" : END;
  };

  return new StateGraph(MessagesAnnotation)
    .addNode("agent", agent)
    .addNode("tools", new ToolNode(assistantTools))
    .addEdge(START, "agent")
    .addConditionalEdges("agent", route, ["tools", END])
    .addEdge("tools", "agent")
    .compile();
}
