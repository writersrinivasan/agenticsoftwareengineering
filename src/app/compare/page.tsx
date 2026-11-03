import type { Metadata } from "next";
import CompareClient from "./CompareClient";

export const metadata: Metadata = { title: "SDLC vs AI-SDLC · Agentic SE Lab" };

export default function ComparePage() {
  return <CompareClient />;
}
