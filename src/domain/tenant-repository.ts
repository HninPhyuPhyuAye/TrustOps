import type { Organization, TrustOpsDataset } from "@/domain/schemas";

export type TenantAccessContext = {
  actorId: string;
  role: "PLATFORM_OPERATOR" | "TENANT_ADMIN" | "SRE_ANALYST" | "SOC_ANALYST" | "AUDITOR";
  organizationIds: string[];
};

export class TenantAccessError extends Error {
  constructor(organizationId: string) {
    super(`Access to organization ${organizationId} is not permitted`);
    this.name = "TenantAccessError";
  }
}

export type OrganizationSnapshot = {
  organization: Organization;
  sites: TrustOpsDataset["sites"];
  services: TrustOpsDataset["services"];
  assets: TrustOpsDataset["assets"];
  signals: TrustOpsDataset["signals"];
  incidents: TrustOpsDataset["incidents"];
  evidence: TrustOpsDataset["evidence"];
  aiInvestigations: TrustOpsDataset["aiInvestigations"];
  runbooks: TrustOpsDataset["runbooks"];
  approvals: TrustOpsDataset["approvals"];
  automationExecutions: TrustOpsDataset["automationExecutions"];
  infrastructureResources: TrustOpsDataset["infrastructureResources"];
  auditEvents: TrustOpsDataset["auditEvents"];
};

export function createTenantRepository(dataset: TrustOpsDataset) {
  function canAccess(context: TenantAccessContext, organizationId: string) {
    return context.organizationIds.includes(organizationId);
  }

  function assertAccess(context: TenantAccessContext, organizationId: string) {
    if (!canAccess(context, organizationId)) {
      throw new TenantAccessError(organizationId);
    }
  }

  return {
    listOrganizations(context: TenantAccessContext) {
      return dataset.organizations.filter((organization) =>
        canAccess(context, organization.id),
      );
    },

    getOrganizationSnapshot(
      context: TenantAccessContext,
      organizationId: string,
    ): OrganizationSnapshot {
      assertAccess(context, organizationId);
      const organization = dataset.organizations.find((item) => item.id === organizationId);

      if (!organization) {
        throw new Error(`Organization ${organizationId} does not exist`);
      }

      const forTenant = <T extends { organizationId: string }>(records: T[]) =>
        records.filter((record) => record.organizationId === organizationId);

      return {
        organization,
        sites: forTenant(dataset.sites),
        services: forTenant(dataset.services),
        assets: forTenant(dataset.assets),
        signals: forTenant(dataset.signals),
        incidents: forTenant(dataset.incidents),
        evidence: forTenant(dataset.evidence),
        aiInvestigations: forTenant(dataset.aiInvestigations),
        runbooks: forTenant(dataset.runbooks),
        approvals: forTenant(dataset.approvals),
        automationExecutions: forTenant(dataset.automationExecutions),
        infrastructureResources: forTenant(dataset.infrastructureResources),
        auditEvents: forTenant(dataset.auditEvents),
      };
    },
  };
}
