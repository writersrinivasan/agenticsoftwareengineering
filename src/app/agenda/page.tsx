import type { Metadata } from "next";
import AgendaClient from "./AgendaClient";

export const metadata: Metadata = { title: "Agenda · Agentic SE Lab" };

export default function AgendaPage() {
  return <AgendaClient />;
}
