import { BarChart3 } from "lucide-react";
import { CapabilityPage } from "@/components/capability-page";

export default function AnalyticsPage() {
  return (
    <CapabilityPage
      eyebrow="Operational analysis"
      title="Translate technical risk into business impact."
      description="Executive analysis will connect reliability, cyber posture, incident response, and service impact across customer organisations."
      icon={BarChart3}
      task="Tasks 4–8"
      capabilities={["Company and industry posture comparison", "MTTD, MTTR, SLO, and incident trends", "Business-service and customer impact", "Executive-ready resilience summaries"]}
    />
  );
}
