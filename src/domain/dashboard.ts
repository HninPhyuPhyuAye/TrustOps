import type { OrganizationSnapshot } from "@/domain/tenant-repository";

export type OrganizationSummary = {
  organizationId: string;
  name: string;
  shortName: string;
  industry: OrganizationSnapshot["organization"]["industry"];
  healthStatus: OrganizationSnapshot["organization"]["healthStatus"];
  riskScore: number;
  siteCount: number;
  impactedSiteCount: number;
  serviceCount: number;
  servicesAtRisk: number;
  availability: number;
  activeIncidents: number;
  highestIncidentSeverity: "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | null;
  activeSecuritySignals: number;
  activeReliabilitySignals: number;
  pendingApprovals: number;
};

export type PortfolioSummary = {
  organizationCount: number;
  organizationsNeedingAttention: number;
  activeIncidents: number;
  activeSecuritySignals: number;
  servicesAtRisk: number;
  pendingApprovals: number;
  averageAvailability: number;
  averageRiskScore: number;
};

const severityRank = {
  INFO: 0,
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
} as const;

function round(value: number, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function summarizeOrganization(
  snapshot: OrganizationSnapshot,
): OrganizationSummary {
  const activeIncidents = snapshot.incidents.filter(
    (incident) => incident.status !== "RESOLVED",
  );
  const highestIncidentSeverity = activeIncidents.reduce<
    OrganizationSummary["highestIncidentSeverity"]
  >((highest, incident) => {
    if (!highest || severityRank[incident.severity] > severityRank[highest]) {
      return incident.severity;
    }
    return highest;
  }, null);
  const availability =
    snapshot.services.length === 0
      ? 100
      : snapshot.services.reduce(
          (total, service) => total + service.currentAvailability,
          0,
        ) / snapshot.services.length;

  return {
    organizationId: snapshot.organization.id,
    name: snapshot.organization.name,
    shortName: snapshot.organization.shortName,
    industry: snapshot.organization.industry,
    healthStatus: snapshot.organization.healthStatus,
    riskScore: snapshot.organization.riskScore,
    siteCount: snapshot.sites.length,
    impactedSiteCount: snapshot.sites.filter((site) => site.healthStatus !== "HEALTHY")
      .length,
    serviceCount: snapshot.services.length,
    servicesAtRisk: snapshot.services.filter(
      (service) => service.currentAvailability < service.availabilityTarget,
    ).length,
    availability: round(availability, 3),
    activeIncidents: activeIncidents.length,
    highestIncidentSeverity,
    activeSecuritySignals: snapshot.signals.filter(
      (signal) => signal.kind === "SECURITY" && signal.status !== "RESOLVED",
    ).length,
    activeReliabilitySignals: snapshot.signals.filter(
      (signal) => signal.kind === "RELIABILITY" && signal.status !== "RESOLVED",
    ).length,
    pendingApprovals: snapshot.approvals.filter(
      (approval) => approval.status === "PENDING",
    ).length,
  };
}

export function summarizePortfolio(
  organizations: OrganizationSummary[],
): PortfolioSummary {
  const divisor = organizations.length || 1;

  return {
    organizationCount: organizations.length,
    organizationsNeedingAttention: organizations.filter(
      (organization) => organization.healthStatus !== "HEALTHY",
    ).length,
    activeIncidents: organizations.reduce(
      (total, organization) => total + organization.activeIncidents,
      0,
    ),
    activeSecuritySignals: organizations.reduce(
      (total, organization) => total + organization.activeSecuritySignals,
      0,
    ),
    servicesAtRisk: organizations.reduce(
      (total, organization) => total + organization.servicesAtRisk,
      0,
    ),
    pendingApprovals: organizations.reduce(
      (total, organization) => total + organization.pendingApprovals,
      0,
    ),
    averageAvailability: round(
      organizations.reduce(
        (total, organization) => total + organization.availability,
        0,
      ) / divisor,
      3,
    ),
    averageRiskScore: round(
      organizations.reduce(
        (total, organization) => total + organization.riskScore,
        0,
      ) / divisor,
      0,
    ),
  };
}
