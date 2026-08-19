import { Network } from "lucide-react";
import { CapabilityPage } from "@/components/capability-page";

export default function InfrastructurePage() {
  return (
    <CapabilityPage
      eyebrow="Platform infrastructure"
      title="Designed for isolation, observability, and recovery."
      description="The reference architecture will cover multi-tenant ingestion, private workloads, encrypted data, CI/CD, monitoring, backup, and Terraform delivery."
      icon={Network}
      task="Task 9"
      capabilities={["Multi-AZ VPC and private application workloads", "Tenant-aware ingestion and encrypted storage", "Container delivery, CI/CD, and security checks", "Terraform modules, monitoring, backup, and recovery"]}
    />
  );
}
