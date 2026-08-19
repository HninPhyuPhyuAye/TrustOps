import { describe, expect, it } from "vitest";

import { demoData } from "@/data/demo-data";
import { summarizeOrganization, summarizePortfolio } from "@/domain/dashboard";
import { DatasetIntegrityError, validateDatasetIntegrity } from "@/domain/integrity";
import { trustOpsDatasetSchema } from "@/domain/schemas";
import { calculateErrorBudgetBurn, summarizeSreWorkspace } from "@/domain/sre";
import {
  createTenantRepository,
  TenantAccessError,
  type TenantAccessContext,
} from "@/domain/tenant-repository";

const repository = createTenantRepository(demoData);

const mspOperator: TenantAccessContext = {
  actorId: "user-msp-operator",
  role: "PLATFORM_OPERATOR",
  organizationIds: ["org-meridian", "org-harbourcare", "org-northstar"],
};

const healthcareAnalyst: TenantAccessContext = {
  actorId: "user-healthcare-analyst",
  role: "SOC_ANALYST",
  organizationIds: ["org-harbourcare"],
};

describe("TrustOps domain fixtures", () => {
  it("parses the complete dataset and contains all three industries", () => {
    expect(() => trustOpsDatasetSchema.parse(demoData)).not.toThrow();
    expect(demoData.organizations).toHaveLength(3);
    expect(new Set(demoData.organizations.map((item) => item.industry))).toEqual(
      new Set(["LOGISTICS", "HEALTHCARE", "PROFESSIONAL_SERVICES"]),
    );
  });

  it("contains SRE, SOC, AI, approval, infrastructure, and audit records", () => {
    expect(demoData.signals.some((signal) => signal.kind === "RELIABILITY")).toBe(true);
    expect(demoData.signals.some((signal) => signal.kind === "SECURITY")).toBe(true);
    expect(demoData.aiInvestigations.length).toBeGreaterThan(0);
    expect(demoData.approvals.length).toBeGreaterThan(0);
    expect(demoData.infrastructureResources.length).toBeGreaterThan(0);
    expect(demoData.auditEvents.length).toBeGreaterThan(0);
  });

  it("rejects references that cross tenant boundaries", () => {
    const invalid = structuredClone(demoData);
    const incident = invalid.incidents.find((item) => item.id === "inc-meridian-001");

    if (!incident) throw new Error("Expected Meridian incident fixture");
    incident.signalIds = ["sig-harbourcare-queue"];

    expect(() => validateDatasetIntegrity(invalid)).toThrow(DatasetIntegrityError);
  });
});

describe("tenant-aware repository", () => {
  it("allows an MSP operator to list all authorised companies", () => {
    expect(repository.listOrganizations(mspOperator)).toHaveLength(3);
  });

  it("returns only the requested tenant's records", () => {
    const snapshot = repository.getOrganizationSnapshot(
      healthcareAnalyst,
      "org-harbourcare",
    );

    expect(snapshot.organization.industry).toBe("HEALTHCARE");
    const collections = [
      snapshot.sites,
      snapshot.services,
      snapshot.serviceMetricPoints,
      snapshot.deployments,
      snapshot.telemetryEvents,
      snapshot.recoveryChecks,
      snapshot.assets,
      snapshot.signals,
      snapshot.incidents,
      snapshot.evidence,
      snapshot.aiInvestigations,
      snapshot.runbooks,
      snapshot.approvals,
      snapshot.infrastructureResources,
      snapshot.auditEvents,
    ];

    for (const records of collections) {
      expect(records.every((record) => record.organizationId === "org-harbourcare")).toBe(
        true,
      );
    }
  });

  it("denies access to a company outside the actor's scope", () => {
    expect(() =>
      repository.getOrganizationSnapshot(healthcareAnalyst, "org-meridian"),
    ).toThrow(TenantAccessError);
  });
});

describe("command centre summaries", () => {
  it("calculates tenant health without mixing organisations", () => {
    const snapshot = repository.getOrganizationSnapshot(
      healthcareAnalyst,
      "org-harbourcare",
    );
    const summary = summarizeOrganization(snapshot);

    expect(summary.serviceCount).toBe(3);
    expect(summary.servicesAtRisk).toBe(1);
    expect(summary.activeIncidents).toBe(1);
    expect(summary.activeSecuritySignals).toBe(1);
  });

  it("aggregates only the authorised organisation summaries", () => {
    const summaries = repository.listOrganizations(mspOperator).map((organization) =>
      summarizeOrganization(
        repository.getOrganizationSnapshot(mspOperator, organization.id),
      ),
    );
    const portfolio = summarizePortfolio(summaries);

    expect(portfolio.organizationCount).toBe(3);
    expect(portfolio.organizationsNeedingAttention).toBe(2);
    expect(portfolio.activeIncidents).toBe(2);
    expect(portfolio.servicesAtRisk).toBe(3);
    expect(portfolio.pendingApprovals).toBe(2);
  });
});

describe("SRE workspace calculations", () => {
  it("calculates error-budget burn from the service SLO", () => {
    const meridian = repository.getOrganizationSnapshot(mspOperator, "org-meridian");
    const shipment = meridian.services.find(
      (service) => service.id === "svc-meridian-shipment",
    );

    if (!shipment) throw new Error("Expected shipment service fixture");
    expect(calculateErrorBudgetBurn(shipment)).toBe(3.9);
  });

  it("summarises golden signals and recovery readiness per tenant", () => {
    const healthcare = repository.getOrganizationSnapshot(
      healthcareAnalyst,
      "org-harbourcare",
    );
    const summary = summarizeSreWorkspace(healthcare);

    expect(summary.serviceCount).toBe(3);
    expect(summary.servicesAtRisk).toBe(1);
    expect(summary.trafficPerMinute).toBeGreaterThan(0);
    expect(summary.recoveryReadiness).toBe(67);
  });
});
