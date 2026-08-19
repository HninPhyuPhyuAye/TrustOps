import { Activity } from "lucide-react";
import { CapabilityPage } from "@/components/capability-page";

export default function SrePage() {
  return (
    <CapabilityPage
      eyebrow="Site reliability engineering"
      title="Make service health explainable."
      description="Reliability signals will connect infrastructure behaviour to customer and business impact instead of stopping at isolated charts."
      icon={Activity}
      task="Task 5"
      capabilities={["Availability, latency, traffic, errors, and saturation", "SLO targets, error budgets, and burn-rate detection", "Deployment, dependency, backup, and recovery readiness", "Correlated metrics, logs, and traces"]}
    />
  );
}
