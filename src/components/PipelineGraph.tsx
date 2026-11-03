"use client";

export type NodeStatus = "idle" | "running" | "done" | "waiting" | "skipped";

export const AGENTS = [
  { id: "requirements_analyst", label: "Requirements", emoji: "📝", color: "#e879f9" },
  { id: "architect", label: "Architect", emoji: "📐", color: "#a78bfa" },
  { id: "review_gate", label: "Human Gate", emoji: "🙋", color: "#fbbf24" },
  { id: "developer", label: "Developer", emoji: "🛠️", color: "#60a5fa" },
  { id: "qa_engineer", label: "QA", emoji: "🧪", color: "#34d399" },
  { id: "security_compliance", label: "Security", emoji: "🔐", color: "#f87171" },
  { id: "devops", label: "DevOps", emoji: "🚀", color: "#22d3ee" },
  { id: "impact_analyst", label: "Impact", emoji: "📊", color: "#facc15" },
] as const;

export type AgentId = (typeof AGENTS)[number]["id"];

const W = 112, H = 66, Y = 120, GAP = 142, X0 = 120;
const cx = (i: number) => X0 + i * GAP;
const idx = (id: string) => AGENTS.findIndex((a) => a.id === id);

interface Props {
  status: Record<string, NodeStatus>;
  edges: Set<string>; // traversed "a>b"
  activeEdge: string | null;
  rounds: Record<string, number>;
  hitl: boolean;
  selected: string;
  onSelect: (id: string) => void;
}

export default function PipelineGraph({ status, edges, activeEdge, rounds, hitl, selected, onSelect }: Props) {
  const endX = cx(AGENTS.length - 1) + 110;
  const edgeCls = (k: string) =>
    k === activeEdge ? "stroke-fuchsia-300 flow-dash" : edges.has(k) ? "stroke-fuchsia-400/80" : "stroke-white/20";
  const marker = (k: string) => (k === activeEdge || edges.has(k) ? "url(#arrowOn)" : "url(#arrow)");

  // straight edges between consecutive nodes
  const straight: [string, string][] = [
    ["START", "requirements_analyst"], ["requirements_analyst", "architect"], ["architect", "review_gate"],
    ["review_gate", "developer"], ["developer", "qa_engineer"], ["qa_engineer", "security_compliance"],
    ["security_compliance", "devops"], ["devops", "impact_analyst"], ["impact_analyst", "END"],
  ];
  const xOf = (id: string, side: "l" | "r") =>
    id === "START" ? 52 : id === "END" ? endX - 14 : cx(idx(id)) + (side === "r" ? W / 2 : -W / 2);

  // arcs
  const arc = (from: string, to: string, dir: "up" | "down", depth: number) => {
    const x1 = cx(idx(from)), x2 = cx(idx(to));
    const y1 = dir === "up" ? Y - H / 2 : Y + H / 2;
    const yc = dir === "up" ? y1 - depth : y1 + depth;
    return `M ${x1} ${y1} C ${x1} ${yc}, ${x2} ${yc}, ${x2} ${y1 + (dir === "up" ? -4 : 4)}`;
  };

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${endX + 40} 250`} className="min-w-[780px] w-full" role="img" aria-label="LangGraph SDLC pipeline">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="rgba(255,255,255,0.3)" />
          </marker>
          <marker id="arrowOn" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="#f0abfc" />
          </marker>
          <linearGradient id="nodeDone" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#7c3aed" stopOpacity="0.55" />
            <stop offset="1" stopColor="#0891b2" stopOpacity="0.55" />
          </linearGradient>
        </defs>

        {/* START / END */}
        <circle cx={36} cy={Y} r={16} fill="#22c55e" opacity={0.85} />
        <text x={36} y={Y + 4} textAnchor="middle" fontSize="9" fontWeight="700" fill="#052e16">START</text>
        <circle cx={endX} cy={Y} r={16} fill={edges.has("impact_analyst>END") ? "#f43f5e" : "rgba(255,255,255,0.15)"} />
        <text x={endX} y={Y + 4} textAnchor="middle" fontSize="9" fontWeight="700" fill="#fff">END</text>

        {/* straight edges */}
        {straight.map(([a, b]) => {
          const k = `${a}>${b}`;
          const dim = !hitl && (a === "architect" || b === "developer") && (a === "review_gate" || b === "review_gate");
          return (
            <line
              key={k}
              x1={xOf(a, "r")} y1={Y} x2={xOf(b, "l") - 2} y2={Y}
              strokeWidth={2.5}
              className={`${edgeCls(k)} ${dim ? "opacity-30" : ""}`}
              strokeDasharray={dim ? "4 5" : undefined}
              markerEnd={marker(k)}
            />
          );
        })}

        {/* bypass Arch → Dev when gate is off */}
        <path d={arc("architect", "developer", "up", 52)} fill="none" strokeWidth={2} className={`${edgeCls("architect>developer")} ${hitl ? "opacity-25" : ""}`} markerEnd={marker("architect>developer")} />
        <text x={(cx(1) + cx(3)) / 2} y={Y - H / 2 - 44} textAnchor="middle" fontSize="10" fill="#c4b5fd">gate off</text>

        {/* reject loop Gate → Arch */}
        <path d={arc("review_gate", "architect", "down", 46)} fill="none" strokeWidth={2} className={edgeCls("review_gate>architect")} markerEnd={marker("review_gate>architect")} />
        <text x={(cx(1) + cx(2)) / 2} y={Y + H / 2 + 48} textAnchor="middle" fontSize="10" fill="#fcd34d">❌ reject → redesign</text>

        {/* reflection loop QA → Dev */}
        <path d={arc("qa_engineer", "developer", "down", 46)} fill="none" strokeWidth={2} className={edgeCls("qa_engineer>developer")} markerEnd={marker("qa_engineer>developer")} />
        <text x={(cx(3) + cx(4)) / 2} y={Y + H / 2 + 48} textAnchor="middle" fontSize="10" fill="#6ee7b7">🔁 FAIL → fix (max 2)</text>

        {/* nodes */}
        {AGENTS.map((a, i) => {
          const s = status[a.id] ?? "idle";
          const x = cx(i) - W / 2, y = Y - H / 2;
          const isGateOff = a.id === "review_gate" && !hitl;
          const fill = s === "done" ? "url(#nodeDone)" : s === "running" ? "rgba(232,121,249,0.25)" : s === "waiting" ? "rgba(251,191,36,0.25)" : "rgba(255,255,255,0.05)";
          const stroke = selected === a.id ? "#fff" : s === "running" ? "#f0abfc" : s === "waiting" ? "#fbbf24" : s === "done" ? a.color : "rgba(255,255,255,0.18)";
          return (
            <g key={a.id} onClick={() => onSelect(a.id)} className={`cursor-pointer ${isGateOff ? "opacity-35" : ""}`}>
              {(s === "running" || s === "waiting") && (
                <rect x={x - 5} y={y - 5} width={W + 10} height={H + 10} rx={20} fill="none" stroke={s === "waiting" ? "#fbbf24" : "#e879f9"} strokeWidth={2} className="animate-pulse" />
              )}
              <rect x={x} y={y} width={W} height={H} rx={16} fill={fill} stroke={stroke} strokeWidth={selected === a.id ? 2.5 : 1.5} />
              <text x={cx(i)} y={y + 26} textAnchor="middle" fontSize="20">{a.emoji}</text>
              <text x={cx(i)} y={y + 47} textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#fff">{a.label}</text>
              <text x={cx(i)} y={y + 60} textAnchor="middle" fontSize="8.5" fill={s === "waiting" ? "#fcd34d" : "#c4b5fd"}>
                {s === "running" ? "thinking…" : s === "waiting" ? "awaiting you" : s === "done" ? `✓ done${rounds[a.id] > 1 ? ` · v${rounds[a.id]}` : ""}` : isGateOff ? "disabled" : "idle"}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
