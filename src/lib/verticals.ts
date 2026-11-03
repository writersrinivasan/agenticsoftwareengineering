// Business-vertical scenarios for the hands-on lab.
// Metrics are ILLUSTRATIVE discussion targets, not measured benchmarks.

export type PhaseKey = "requirements" | "design" | "build" | "test" | "deploy" | "operate";

export interface Metric {
  label: string;
  before: number;
  after: number;
  unit: string;
  lowerIsBetter: boolean;
}

export interface Vertical {
  id: string;
  name: string;
  short: string;
  emoji: string;
  gradient: string; // tailwind gradient classes
  accent: string; // hex
  tagline: string;
  client: string;
  requirement: string;
  compliance: string[];
  traditional: Record<PhaseKey, string>;
  agentic: Record<PhaseKey, string>;
  metrics: Metric[];
  exercises: string[];
  reflection: string[];
}

export const PHASES: { key: PhaseKey; label: string; icon: string }[] = [
  { key: "requirements", label: "Requirements", icon: "📝" },
  { key: "design", label: "Design", icon: "📐" },
  { key: "build", label: "Build", icon: "🛠️" },
  { key: "test", label: "Test", icon: "🧪" },
  { key: "deploy", label: "Deploy", icon: "🚀" },
  { key: "operate", label: "Operate", icon: "📡" },
];

export const VERTICALS: Vertical[] = [
  {
    id: "banking",
    name: "Banking & FinTech",
    short: "Banking",
    emoji: "🏦",
    gradient: "from-emerald-400 via-teal-500 to-cyan-600",
    accent: "#14b8a6",
    tagline: "Real-time payments, real-time risk",
    client: "A mid-size Mexican bank modernising its instant-payments channel.",
    requirement:
      "Build a real-time fraud-scoring microservice for SPEI instant transfers. Every outgoing transfer must be scored in under 150 ms using device fingerprint, transfer velocity and beneficiary history. High-risk transfers are held for step-up authentication in the mobile app. Analysts need a dashboard to review held transfers and mark false positives, which feed back into the rules.",
    compliance: ["CNBV & Banxico SPEI rules", "PCI-DSS 4.0", "Mexican personal-data protection law", "SOX audit trail"],
    traditional: {
      requirements: "BRD written by BAs over 4–6 weeks; risk, compliance and IT sign-offs happen in sequence.",
      design: "Architecture board meets monthly; design docs drift from the code almost immediately.",
      build: "Hand-coded rule engine; developers re-implement the same validation patterns per channel.",
      test: "Manual regression in a shared UAT environment that's always contended; low edge-case coverage.",
      deploy: "Quarterly release windows, with change tickets approved by CAB.",
      operate: "Fraud rules tuned manually after incidents; slow feedback loop from analysts.",
    },
    agentic: {
      requirements: "Requirements agent turns regulator circulars + stakeholder notes into user stories with Gherkin criteria and a compliance trace matrix.",
      design: "Architect agent proposes event-driven design and latency budget; humans approve it at an Architecture Review gate.",
      build: "Coding agent generates the scoring service + tests; reflection loop with QA agent until criteria pass.",
      test: "Test agent synthesises fraud edge cases (mule accounts, velocity bursts) and property-based tests.",
      deploy: "DevOps agent writes the pipeline with canary + automatic rollback on p99 latency regression.",
      operate: "Ops agent summarises false-positive trends and proposes rule changes as pull requests for human review.",
    },
    metrics: [
      { label: "Idea → production", before: 16, after: 5, unit: "weeks", lowerIsBetter: true },
      { label: "Test coverage", before: 45, after: 85, unit: "%", lowerIsBetter: false },
      { label: "Escaped defects / release", before: 12, after: 4, unit: "", lowerIsBetter: true },
      { label: "Compliance evidence effort", before: 80, after: 20, unit: "hrs", lowerIsBetter: true },
    ],
    exercises: [
      "Run the pipeline with the default requirement. Find where the Requirements agent mapped stories to compliance controls.",
      "Turn on the Architecture Review gate and reject the first design with this feedback: “p99 latency must be < 150 ms; justify cache strategy.” Compare v1 and v2.",
      "Ask the AI Assistant: “What could go wrong if the coding agent has write access to production fraud rules?”",
    ],
    reflection: [
      "Which decisions must stay human in a regulated bank?",
      "How would you prove to an auditor what the agent generated and who approved it?",
    ],
  },
  {
    id: "healthcare",
    name: "Healthcare & Life Sciences",
    short: "Healthcare",
    emoji: "🩺",
    gradient: "from-rose-400 via-pink-500 to-fuchsia-600",
    accent: "#ec4899",
    tagline: "Safer care, faster software",
    client: "A US hospital network with a nearshore delivery team in Mexico.",
    requirement:
      "Create a telemedicine follow-up module. After a video consultation, the doctor issues an e-prescription and a follow-up plan. Patients get reminders by SMS/WhatsApp in English or Spanish, and can report symptoms. Red-flag symptoms escalate to a nurse within 10 minutes. Integrate with the EHR using HL7 FHIR R4 resources.",
    compliance: ["HIPAA (PHI)", "HL7 FHIR R4", "NOM-024-SSA3 (health information systems)", "FDA SaMD guidance for clinical decision support"],
    traditional: {
      requirements: "Clinical workflows captured in long workshops; ambiguity is found late, during UAT with clinicians.",
      design: "Integration specs for FHIR resources written by hand; mapping errors are common.",
      build: "Boilerplate for FHIR clients and consent handling is rewritten per project.",
      test: "PHI-safe test data is scarce; testers wait weeks for de-identified datasets.",
      deploy: "Change freezes around go-lives; long validation documentation cycles.",
      operate: "Escalation SLAs monitored manually; incidents found through patient complaints.",
    },
    agentic: {
      requirements: "Requirements agent drafts clinical user stories and flags ambiguous red-flag rules for clinician review.",
      design: "Architect agent maps the flow to FHIR resources (MedicationRequest, CarePlan, Communication).",
      build: "Coding agent scaffolds FHIR client, consent checks and bilingual message templates.",
      test: "Test agent generates synthetic, PHI-free patient journeys, including escalation-timeout cases.",
      deploy: "DevOps agent produces validation evidence (IQ/OQ style) as pipeline artefacts.",
      operate: "Monitoring agent watches escalation SLA and opens incidents with context.",
    },
    metrics: [
      { label: "Requirements clarification cycles", before: 6, after: 2, unit: "", lowerIsBetter: true },
      { label: "Integration defects", before: 30, after: 9, unit: "", lowerIsBetter: true },
      { label: "Time to synthetic test data", before: 15, after: 1, unit: "days", lowerIsBetter: true },
      { label: "Validation docs effort", before: 120, after: 35, unit: "hrs", lowerIsBetter: true },
    ],
    exercises: [
      "Run the pipeline in Español and check that patient-facing templates are bilingual.",
      "Look at the Security & Compliance agent's output. Did it identify every place PHI flows? Add anything it missed.",
      "Ask the Assistant to explain why a human clinician must approve red-flag escalation rules.",
    ],
    reflection: [
      "Where is hallucination risk most dangerous in a clinical workflow?",
      "How do you keep PHI out of LLM prompts?",
    ],
  },
  {
    id: "retail",
    name: "Retail & E-commerce",
    short: "Retail",
    emoji: "🛒",
    gradient: "from-amber-300 via-orange-500 to-red-500",
    accent: "#f97316",
    tagline: "Omnichannel at the speed of demand",
    client: "A Mexican omnichannel retailer preparing for El Buen Fin peak traffic.",
    requirement:
      "Build an omnichannel checkout that supports buy-online-pickup-in-store, OXXO cash payments and card payments, and automatically issues a CFDI 4.0 electronic invoice through a PAC when the customer gives their RFC. The system must handle 10x normal traffic during El Buen Fin without losing orders.",
    compliance: ["SAT CFDI 4.0 e-invoicing", "PCI-DSS", "PROFECO consumer protection", "Mexican personal-data protection law"],
    traditional: {
      requirements: "Marketing, finance and stores each write separate requirements; conflicts surface in sprint reviews.",
      design: "Peak-load design is guesswork; capacity tests happen weeks before the event.",
      build: "Invoice (CFDI) XML handling is hand-coded and fragile when SAT updates catalogues.",
      test: "Load tests are expensive and run once; payment edge cases are under-tested.",
      deploy: "Code freeze 6 weeks before peak season blocks features.",
      operate: "War rooms during peak; manual triage of failed orders.",
    },
    agentic: {
      requirements: "Requirements agent merges stakeholder inputs into one backlog and flags conflicts automatically.",
      design: "Architect agent designs queue-based order intake and an idempotent invoicing saga.",
      build: "Coding agent generates CFDI builder with schema validation and PAC adapter interface.",
      test: "Test agent generates load profiles and payment failure scenarios (OXXO expiry, card declines).",
      deploy: "DevOps agent sets up feature flags so features can ship safely during the freeze.",
      operate: "Ops agent auto-groups failed orders by root cause and suggests remediation.",
    },
    metrics: [
      { label: "Feature lead time", before: 10, after: 3, unit: "weeks", lowerIsBetter: true },
      { label: "Checkout conversion", before: 2.1, after: 2.8, unit: "%", lowerIsBetter: false },
      { label: "Invoice rejection rate", before: 4, after: 0.8, unit: "%", lowerIsBetter: true },
      { label: "Peak incidents", before: 14, after: 5, unit: "", lowerIsBetter: true },
    ],
    exercises: [
      "Run the pipeline and check whether the Architect designed for idempotency (no duplicate invoices on retries).",
      "Turn on Force reflection loop. What did QA reject in iteration 1, and did the Developer fix it?",
      "Edit the requirement to add Mercado Pago wallet payments and re-run. Which agents' outputs changed the most?",
    ],
    reflection: [
      "Which parts of peak-season readiness can an agent own and which can't it?",
      "How would you measure ROI of the agentic pipeline for this retailer?",
    ],
  },
  {
    id: "manufacturing",
    name: "Manufacturing & Industry 4.0",
    short: "Manufacturing",
    emoji: "🏭",
    gradient: "from-sky-400 via-blue-500 to-indigo-600",
    accent: "#3b82f6",
    tagline: "Nearshoring needs smart factories",
    client: "An automotive Tier-1 supplier in Monterrey scaling up for nearshoring demand.",
    requirement:
      "Build a predictive-maintenance service for CNC machines. Ingest vibration and temperature telemetry over OPC-UA/MQTT every second, detect anomalies, predict failure probability for the next 72 hours, and create work orders in the maintenance system (SAP PM) when risk exceeds a threshold. Plant supervisors need a shift dashboard in Spanish.",
    compliance: ["IATF 16949", "ISO 9001", "IEC 62443 (industrial cybersecurity)", "Data residency for plant data"],
    traditional: {
      requirements: "Requirements depend on a few plant experts whose knowledge is mostly undocumented.",
      design: "OT/IT integration designed manually; protocol mismatches found on the shop floor.",
      build: "Data-pipeline code is bespoke for every plant line.",
      test: "Hard to test without real machines; testing happens on the production line.",
      deploy: "Edge deployments by USB or manual SSH; inconsistent versions across lines.",
      operate: "Reactive maintenance; downtime discovered when the machine stops.",
    },
    agentic: {
      requirements: "Requirements agent interviews (chat) plant experts and turns tacit knowledge into stories and thresholds.",
      design: "Architect agent designs an edge + cloud reference architecture with OPC-UA/MQTT adapters.",
      build: "Coding agent generates ingestion, feature extraction and SAP PM integration stubs.",
      test: "Test agent builds a telemetry simulator with failure signatures for repeatable tests.",
      deploy: "DevOps agent creates GitOps manifests for edge clusters with staged rollout per line.",
      operate: "Ops agent explains each anomaly in plain Spanish for supervisors.",
    },
    metrics: [
      { label: "Unplanned downtime", before: 9, after: 4, unit: "%", lowerIsBetter: true },
      { label: "New-line onboarding", before: 12, after: 3, unit: "weeks", lowerIsBetter: true },
      { label: "Defects found on shop floor", before: 20, after: 6, unit: "", lowerIsBetter: true },
      { label: "Code reuse across plants", before: 25, after: 70, unit: "%", lowerIsBetter: false },
    ],
    exercises: [
      "Run the pipeline and review the DevOps agent's edge rollout strategy. Is it safe for a 24/7 line?",
      "Ask the Assistant: “How does a LangGraph checkpointer help long-running plant workflows?”",
      "Change the threshold rule in the requirement and see how the QA agent's test cases change.",
    ],
    reflection: [
      "What are the safety implications of an agent creating work orders automatically?",
      "How do you capture tacit expert knowledge before it leaves the company?",
    ],
  },
  {
    id: "insurance",
    name: "Insurance",
    short: "Insurance",
    emoji: "🛡️",
    gradient: "from-violet-400 via-purple-500 to-fuchsia-600",
    accent: "#a855f7",
    tagline: "From claim to cash in hours, not weeks",
    client: "A P&C insurer serving Mexico and the US Southwest.",
    requirement:
      "Build a First Notice of Loss (FNOL) flow for auto claims. Policyholders upload photos and a description through WhatsApp or the app. The system extracts details, checks policy coverage, estimates damage severity, flags potential fraud, and routes simple claims to straight-through processing while complex claims go to an adjuster with a summary.",
    compliance: ["CNSF regulations", "NAIC model laws (US)", "Fair-treatment / explainability of automated decisions", "SOC 2"],
    traditional: {
      requirements: "Product rules buried in policy PDFs and legacy mainframe code.",
      design: "Point-to-point integrations with core policy systems; changes are risky.",
      build: "Rules hard-coded; every new product requires developer time.",
      test: "Test cases built manually from past claims; little fraud coverage.",
      deploy: "Releases tied to core system release trains (every 3–6 months).",
      operate: "Adjusters re-key data; customers wait days for first contact.",
    },
    agentic: {
      requirements: "Requirements agent extracts coverage rules from policy docs into testable decision tables.",
      design: "Architect agent designs an orchestration layer with explainable decision logging.",
      build: "Coding agent generates the rules engine + adapter to the core system API.",
      test: "Test agent creates synthetic claims, including fraud patterns and edge coverage cases.",
      deploy: "DevOps agent releases independently of the core system via an anti-corruption layer.",
      operate: "Ops agent drafts adjuster summaries and monitors decision drift.",
    },
    metrics: [
      { label: "FNOL → first decision", before: 72, after: 4, unit: "hrs", lowerIsBetter: true },
      { label: "Straight-through processing", before: 10, after: 45, unit: "%", lowerIsBetter: false },
      { label: "Rule change lead time", before: 8, after: 1, unit: "weeks", lowerIsBetter: true },
      { label: "Fraud leakage", before: 6, after: 3, unit: "%", lowerIsBetter: true },
    ],
    exercises: [
      "Run the pipeline and check whether automated decisions are explainable and logged.",
      "Use the Review gate to require: “every rejection must have a human-readable reason code”. See how v2 changes.",
      "Ask the Assistant to compare a supervisor multi-agent pattern with the sequential pipeline used here.",
    ],
    reflection: [
      "Which claim decisions should never be fully automated?",
      "How do you detect bias in AI-assisted claim triage?",
    ],
  },
  {
    id: "telecom",
    name: "Telecom & Media",
    short: "Telecom",
    emoji: "📶",
    gradient: "from-cyan-300 via-sky-500 to-blue-600",
    accent: "#0ea5e9",
    tagline: "Self-service networks, self-healing software",
    client: "A Latin American mobile operator launching 5G plans.",
    requirement:
      "Build a self-service plan-change and churn-prevention engine. When a customer opens the app to cancel or downgrade, the engine predicts churn risk, generates a personalised retention offer within business guardrails (max discount, eligibility), and applies the plan change immediately through TM Forum Open APIs. All offers must be auditable.",
    compliance: ["Telecom regulator consumer rules", "TM Forum Open APIs (TMF622/TMF679)", "Personal-data protection law", "Accessibility (WCAG 2.2)"],
    traditional: {
      requirements: "Marketing campaigns defined in slide decks; IT translates them into tickets.",
      design: "BSS/OSS changes require multiple vendor teams to coordinate.",
      build: "Offer logic duplicated across app, call centre and stores.",
      test: "End-to-end tests require full BSS stack; environment shortages.",
      deploy: "Monthly releases; urgent offers miss market windows.",
      operate: "Churn analysed monthly in reports, after customers have already left.",
    },
    agentic: {
      requirements: "Requirements agent converts campaign briefs into rules with guardrails and acceptance tests.",
      design: "Architect agent designs one offer-decision service exposed to all channels.",
      build: "Coding agent generates TMF Open API clients and guardrail validators.",
      test: "Test agent generates contract tests against TMF API specs and mocks BSS.",
      deploy: "DevOps agent ships offers behind experiment flags (A/B) with automated analysis.",
      operate: "Ops agent detects offer abuse and anomalies in near real time.",
    },
    metrics: [
      { label: "Campaign launch time", before: 6, after: 1, unit: "weeks", lowerIsBetter: true },
      { label: "Monthly churn", before: 2.5, after: 1.9, unit: "%", lowerIsBetter: true },
      { label: "Integration test env wait", before: 10, after: 1, unit: "days", lowerIsBetter: true },
      { label: "Channel logic duplication", before: 3, after: 1, unit: "copies", lowerIsBetter: true },
    ],
    exercises: [
      "Run the pipeline and verify the Developer agent enforced the max-discount guardrail in code, not only in the UI.",
      "Turn on Force reflection loop and watch the QA → Developer cycle in the graph.",
      "Ask the Assistant how to give the offer agent tools while preventing it from issuing unlimited discounts.",
    ],
    reflection: [
      "What is the difference between a guardrail in the prompt and a guardrail in code?",
      "How do you A/B test an AI-generated offer responsibly?",
    ],
  },
  {
    id: "logistics",
    name: "Logistics & Supply Chain",
    short: "Logistics",
    emoji: "🚚",
    gradient: "from-lime-300 via-green-500 to-emerald-600",
    accent: "#22c55e",
    tagline: "Cross-border visibility, end to end",
    client: "A 3PL moving freight between Mexico and the US (USMCA/T-MEC corridor).",
    requirement:
      "Build a cross-border shipment-tracking platform. Each shipment generates the CFDI with Carta Porte complement, tracks GPS positions from trucks, predicts border-crossing wait times at Nuevo Laredo, and alerts customers proactively about delays. Customs brokers must be able to upload and validate documents before the truck reaches the border.",
    compliance: ["SAT Carta Porte complement", "USMCA / T-MEC rules of origin", "CBP & C-TPAT security", "Data-retention requirements"],
    traditional: {
      requirements: "Requirements spread across carriers, brokers and customers; nobody owns the whole flow.",
      design: "Integrations with carriers via email, EDI and spreadsheets.",
      build: "Document validation coded per customer; Carta Porte catalogue changes break it.",
      test: "Real border scenarios are hard to reproduce; tests skip exceptions.",
      deploy: "Manual deployments; downtime affects trucks waiting at the border.",
      operate: "Ops staff phone drivers for status; customers learn about delays too late.",
    },
    agentic: {
      requirements: "Requirements agent models the end-to-end journey across all actors and exceptions.",
      design: "Architect agent designs event-sourced tracking with document-validation microservice.",
      build: "Coding agent generates Carta Porte validators driven by SAT catalogues.",
      test: "Test agent simulates trips with GPS gaps, document errors and border delays.",
      deploy: "DevOps agent sets up blue-green deployment so tracking never goes offline.",
      operate: "Ops agent predicts delays and drafts proactive customer messages.",
    },
    metrics: [
      { label: "Border document rejections", before: 8, after: 2, unit: "%", lowerIsBetter: true },
      { label: "Proactive delay alerts", before: 15, after: 80, unit: "%", lowerIsBetter: false },
      { label: "Carrier onboarding", before: 4, after: 1, unit: "weeks", lowerIsBetter: true },
      { label: "Status calls to drivers", before: 300, after: 60, unit: "/day", lowerIsBetter: true },
    ],
    exercises: [
      "Run the pipeline and identify each actor (driver, broker, customer, SAT) in the user stories.",
      "Reject the architecture at the gate: “must work offline when trucks lose connectivity”. Compare designs.",
      "Ask the Assistant to outline a LangGraph agent that monitors shipments and calls a notify tool.",
    ],
    reflection: [
      "Which exceptions in logistics are best left to humans?",
      "How would you test an agent that predicts border wait times?",
    ],
  },
  {
    id: "energy",
    name: "Energy & Utilities",
    short: "Energy",
    emoji: "⚡",
    gradient: "from-yellow-300 via-amber-400 to-orange-600",
    accent: "#f59e0b",
    tagline: "Smart grids need smart delivery",
    client: "A utility rolling out smart meters across residential customers.",
    requirement:
      "Build a smart-meter billing anomaly detector. Ingest 15-minute interval readings from 2 million meters, detect anomalies (meter tampering, zero consumption, sudden spikes), hold suspicious bills before they are sent, and give customer service agents an explanation they can share with the customer. Bills must still go out on schedule.",
    compliance: ["Energy regulator billing rules", "NERC CIP (where applicable)", "ISO 50001", "Personal-data protection law"],
    traditional: {
      requirements: "Billing rules exist only in a legacy CIS and the heads of senior analysts.",
      design: "Batch-oriented design; anomalies found after bills are sent.",
      build: "Complex SQL scripts maintained by a few people.",
      test: "Tests on sampled data; rare anomalies go unseen.",
      deploy: "Releases avoided near billing cycles; long freeze periods.",
      operate: "Customer complaints are the main anomaly detector.",
    },
    agentic: {
      requirements: "Requirements agent reverse-engineers billing rules from legacy SQL into readable specs.",
      design: "Architect agent designs a streaming + batch (lambda) pipeline with hold/release workflow.",
      build: "Coding agent generates detectors and explanation templates for customer service.",
      test: "Test agent generates rare anomaly scenarios at scale with synthetic meter data.",
      deploy: "DevOps agent schedules safe deployment windows around billing cycles automatically.",
      operate: "Ops agent explains each held bill and tracks false-positive rate.",
    },
    metrics: [
      { label: "Billing complaints", before: 5, after: 2, unit: "%", lowerIsBetter: true },
      { label: "Anomalies caught pre-bill", before: 20, after: 75, unit: "%", lowerIsBetter: false },
      { label: "Legacy rule documentation", before: 10, after: 90, unit: "%", lowerIsBetter: false },
      { label: "Release frequency", before: 4, after: 24, unit: "/yr", lowerIsBetter: false },
    ],
    exercises: [
      "Run the pipeline and check how the Architect handled “bills must still go out on schedule”.",
      "Read the Impact Analyst's report and challenge one number. Is it realistic?",
      "Ask the Assistant: “How do I keep the LLM from inventing billing rules that don't exist?”",
    ],
    reflection: [
      "How do you verify an agent's interpretation of legacy code?",
      "What evidence would a regulator want for AI-assisted billing holds?",
    ],
  },
];

export const getVertical = (id: string) => VERTICALS.find((v) => v.id === id);
