import { ShieldCheck } from "lucide-react";
import { CapabilityPage } from "@/components/capability-page";

export default function SocPage() {
  return (
    <CapabilityPage
      eyebrow="Security operations centre"
      title="Turn scattered alerts into investigations."
      description="Identity, cloud, endpoint, network, and application evidence will share one tenant-aware security workspace."
      icon={ShieldCheck}
      task="Task 6"
      capabilities={["Identity and access anomalies", "Asset exposure and vulnerability posture", "Cloud drift, API abuse, and attack detections", "Severity, confidence, evidence, and affected assets"]}
    />
  );
}
