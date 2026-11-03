import type { Metadata } from "next";
import LabsClient from "./LabsClient";

export const metadata: Metadata = { title: "Hands-on Labs · Agentic SE Lab" };

export default function LabsPage() {
  return <LabsClient />;
}
