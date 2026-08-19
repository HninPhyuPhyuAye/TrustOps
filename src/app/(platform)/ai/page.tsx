import { BrainCircuit } from "lucide-react";
import { CapabilityPage } from "@/components/capability-page";

export default function AiPage() {
  return (
    <CapabilityPage
      eyebrow="Explainable AI analyst"
      title="Assist judgement without replacing it."
      description="The analyst will prepare source-linked hypotheses, uncertainty, blast radius, and runbook recommendations for an engineer to verify."
      icon={BrainCircuit}
      task="Task 7"
      capabilities={["Evidence citations and source traceability", "Root-cause hypothesis with explicit uncertainty", "Tenant-scoped runbook retrieval", "Draft stakeholder and post-incident communication"]}
    />
  );
}
