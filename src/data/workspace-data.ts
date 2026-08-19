import { demoData } from "@/data/demo-data";
import { summarizeOrganization, summarizePortfolio } from "@/domain/dashboard";
import {
  createTenantRepository,
  type OrganizationSnapshot,
  type TenantAccessContext,
} from "@/domain/tenant-repository";

const demoOperator: TenantAccessContext = {
  actorId: "demo-msp-operator",
  role: "PLATFORM_OPERATOR",
  organizationIds: demoData.organizations.map((organization) => organization.id),
};

const repository = createTenantRepository(demoData);

export const workspaceOrganizations = repository.listOrganizations(demoOperator);

export const workspaceSnapshots = new Map<string, OrganizationSnapshot>(
  workspaceOrganizations.map((organization) => [
    organization.id,
    repository.getOrganizationSnapshot(demoOperator, organization.id),
  ]),
);

export const workspaceOrganizationSummaries = workspaceOrganizations
  .map((organization) => {
    const snapshot = workspaceSnapshots.get(organization.id);
    if (!snapshot) throw new Error(`Missing snapshot for ${organization.id}`);
    return summarizeOrganization(snapshot);
  })
  .sort((left, right) => right.riskScore - left.riskScore);

export const workspacePortfolioSummary = summarizePortfolio(
  workspaceOrganizationSummaries,
);
