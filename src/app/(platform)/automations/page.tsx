import { Workflow } from "lucide-react";
import { CapabilityPage } from "@/components/capability-page";

export default function AutomationsPage() {
  return (
    <CapabilityPage
      eyebrow="Controlled automation"
      title="Every consequential action has an owner."
      description="Deterministic policies, role checks, and human approval will sit between an AI recommendation and a simulated remediation."
      icon={Workflow}
      task="Task 8"
      capabilities={["Approval and rejection queue", "Role and policy enforcement", "Simulated runbook execution and rollback", "Outcome verification and audit events"]}
    />
  );
}
