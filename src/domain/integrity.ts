import type { TrustOpsDataset } from "@/domain/schemas";

export class DatasetIntegrityError extends Error {
  constructor(public readonly issues: string[]) {
    super(`TrustOps dataset failed integrity validation:\n${issues.join("\n")}`);
    this.name = "DatasetIntegrityError";
  }
}

type TenantRecord = { id: string; organizationId: string };

function addDuplicateIssues(collection: string, records: Array<{ id: string }>, issues: string[]) {
  const seen = new Set<string>();

  for (const record of records) {
    if (seen.has(record.id)) {
      issues.push(`${collection} contains duplicate id ${record.id}`);
    }
    seen.add(record.id);
  }
}

function tenantIndex(records: TenantRecord[]) {
  return new Map(records.map((record) => [record.id, record.organizationId]));
}

function requireTenantReference(
  issues: string[],
  owner: TenantRecord,
  relation: string,
  referencedId: string,
  referencedTenants: Map<string, string>,
) {
  const referencedTenant = referencedTenants.get(referencedId);

  if (!referencedTenant) {
    issues.push(`${owner.id} references missing ${relation} ${referencedId}`);
  } else if (referencedTenant !== owner.organizationId) {
    issues.push(`${owner.id} references ${relation} ${referencedId} from another tenant`);
  }
}

export function validateDatasetIntegrity(dataset: TrustOpsDataset): TrustOpsDataset {
  const issues: string[] = [];
  const organizationIds = new Set(dataset.organizations.map((organization) => organization.id));
  const tenantCollections: Array<[string, TenantRecord[]]> = [
    ["sites", dataset.sites],
    ["services", dataset.services],
    ["assets", dataset.assets],
    ["signals", dataset.signals],
    ["incidents", dataset.incidents],
    ["evidence", dataset.evidence],
    ["aiInvestigations", dataset.aiInvestigations],
    ["runbooks", dataset.runbooks],
    ["approvals", dataset.approvals],
    ["automationExecutions", dataset.automationExecutions],
    ["infrastructureResources", dataset.infrastructureResources],
    ["auditEvents", dataset.auditEvents],
  ];

  addDuplicateIssues("organizations", dataset.organizations, issues);
  for (const [name, records] of tenantCollections) {
    addDuplicateIssues(name, records, issues);
    for (const record of records) {
      if (!organizationIds.has(record.organizationId)) {
        issues.push(`${record.id} references missing organization ${record.organizationId}`);
      }
    }
  }

  const sites = tenantIndex(dataset.sites);
  const services = tenantIndex(dataset.services);
  const assets = tenantIndex(dataset.assets);
  const signals = tenantIndex(dataset.signals);
  const incidents = tenantIndex(dataset.incidents);
  const evidence = tenantIndex(dataset.evidence);
  const runbooks = tenantIndex(dataset.runbooks);
  const approvals = tenantIndex(dataset.approvals);

  for (const service of dataset.services) {
    for (const siteId of service.siteIds) {
      requireTenantReference(issues, service, "site", siteId, sites);
    }
  }

  for (const asset of dataset.assets) {
    if (asset.siteId) requireTenantReference(issues, asset, "site", asset.siteId, sites);
    if (asset.serviceId) {
      requireTenantReference(issues, asset, "service", asset.serviceId, services);
    }
  }

  for (const signal of dataset.signals) {
    if (signal.serviceId) {
      requireTenantReference(issues, signal, "service", signal.serviceId, services);
    }
    if (signal.assetId) {
      requireTenantReference(issues, signal, "asset", signal.assetId, assets);
    }
  }

  for (const incident of dataset.incidents) {
    for (const signalId of incident.signalIds) {
      requireTenantReference(issues, incident, "signal", signalId, signals);
    }
    for (const serviceId of incident.serviceIds) {
      requireTenantReference(issues, incident, "service", serviceId, services);
    }
    for (const assetId of incident.assetIds) {
      requireTenantReference(issues, incident, "asset", assetId, assets);
    }
  }

  for (const item of dataset.evidence) {
    requireTenantReference(issues, item, "incident", item.incidentId, incidents);
    if (item.signalId) {
      requireTenantReference(issues, item, "signal", item.signalId, signals);
    }
  }

  for (const investigation of dataset.aiInvestigations) {
    requireTenantReference(
      issues,
      investigation,
      "incident",
      investigation.incidentId,
      incidents,
    );
    for (const evidenceId of investigation.evidenceIds) {
      requireTenantReference(issues, investigation, "evidence", evidenceId, evidence);
    }
  }

  for (const approval of dataset.approvals) {
    requireTenantReference(issues, approval, "incident", approval.incidentId, incidents);
    requireTenantReference(issues, approval, "runbook", approval.runbookId, runbooks);
  }

  for (const execution of dataset.automationExecutions) {
    requireTenantReference(issues, execution, "incident", execution.incidentId, incidents);
    requireTenantReference(issues, execution, "runbook", execution.runbookId, runbooks);
    requireTenantReference(issues, execution, "approval", execution.approvalId, approvals);
  }

  if (issues.length > 0) {
    throw new DatasetIntegrityError(issues);
  }

  return dataset;
}
