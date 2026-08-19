import { RadioTower } from "lucide-react";
import { CapabilityPage } from "@/components/capability-page";

export default function IncidentsPage() {
  return (
    <CapabilityPage
      eyebrow="Unified response"
      title="One timeline for reliability and security."
      description="TrustOps will join related operational and cyber evidence into a single incident with ownership, impact, and recovery state."
      icon={RadioTower}
      task="Task 7"
      capabilities={["Cross-domain incident correlation", "Business service and tenant impact", "Evidence timeline and investigation notes", "Escalation, ownership, and recovery state"]}
    />
  );
}
