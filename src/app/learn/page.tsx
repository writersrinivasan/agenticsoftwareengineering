import type { Metadata } from "next";
import LearnClient from "./LearnClient";

export const metadata: Metadata = { title: "Learning Path · Agentic SE Lab" };

export default function LearnPage() {
  return <LearnClient />;
}
