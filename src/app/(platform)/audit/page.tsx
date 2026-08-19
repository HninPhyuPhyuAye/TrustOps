import { ScrollText } from "lucide-react";
import { CapabilityPage } from "@/components/capability-page";

export default function AuditPage() {
  return (
    <CapabilityPage
      eyebrow="Governance and evidence"
      title="Make every decision reconstructable."
      description="An append-only demonstration trail will record detection, analysis, approval, execution, verification, and actor identity."
      icon={ScrollText}
      task="Task 8"
      capabilities={["Actor, tenant, time, and action attribution", "Approval and policy decision records", "Runbook execution and verification evidence", "Export-ready incident history"]}
    />
  );
}
