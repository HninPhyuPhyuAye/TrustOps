import { describe, expect, it } from "vitest";

import { demoData } from "@/data/demo-data";
import {
  buildAuditChain,
  buildAutomationCases,
  demoAutomationActors,
  evaluateApprovalPolicy,
  summarizeAutomationCases,
  verificationResultFor,
} from "@/domain/automation";
import { summarizeOrganization, summarizePortfolio } from "@/domain/dashboard";
import { DatasetIntegrityError, validateDatasetIntegrity } from "@/domain/integrity";
import {
  buildIncidentCases,
  summarizeIncidentCases,
} from "@/domain/incidents";
import { trustOpsDatasetSchema } from "@/domain/schemas";
import { summarizeSocWorkspace } from "@/domain/soc";
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
      snapshot.securityDetections,
      snapshot.exposureFindings,
      snapshot.securityControls,
      snapshot.incidents,
      snapshot.evidence,
      snapshot.aiInvestigations,
      snapshot.runbooks,
      snapshot.approvals,
      snapshot.automationExecutions,
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
    expect(summary.activeSecuritySignals).toBe(2);
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

describe("SOC workspace calculations", () => {
  it("summarises detections, exposure, and controls inside one tenant", () => {
    const healthcare = repository.getOrganizationSnapshot(
      healthcareAnalyst,
      "org-harbourcare",
    );
    const summary = summarizeSocWorkspace(healthcare);

    expect(summary.detectionCount).toBe(2);
    expect(summary.activeDetections).toBe(2);
    expect(summary.highPriorityDetections).toBe(1);
    expect(summary.untriagedDetections).toBe(1);
    expect(summary.openFindings).toBe(2);
    expect(summary.averageControlCoverage).toBe(79);
  });
});

describe("incident and explainable AI correlation", () => {
  it("joins SRE and SOC evidence into one chronological tenant case", () => {
    const meridian = repository.getOrganizationSnapshot(mspOperator, "org-meridian");
    const [incidentCase] = buildIncidentCases(meridian);

    if (!incidentCase) throw new Error("Expected Meridian incident case");
    expect(incidentCase.domains).toEqual(["SRE", "SOC"]);
    expect(incidentCase.timeline.map((item) => item.occurredAt)).toEqual(
      [...incidentCase.timeline]
        .sort((left, right) => left.occurredAt.localeCompare(right.occurredAt))
        .map((item) => item.occurredAt),
    );
    expect(incidentCase.evidenceCoveragePercent).toBe(100);
    expect(incidentCase.recommendedRunbook?.organizationId).toBe("org-meridian");
  });

  it("preserves counter-evidence and explicit AI limitations", () => {
    const healthcare = repository.getOrganizationSnapshot(
      healthcareAnalyst,
      "org-harbourcare",
    );
    const [incidentCase] = buildIncidentCases(healthcare);

    if (!incidentCase) throw new Error("Expected HarbourCare incident case");
    expect(incidentCase.counterEvidenceCount).toBe(1);
    expect(incidentCase.investigation?.limitations.length).toBeGreaterThan(0);
    expect(incidentCase.stakeholderDraft).toContain(
      "no automated action will run without approval",
    );
  });

  it("summarises only incident cases supplied by the authorised scope", () => {
    const cases = repository
      .listOrganizations(mspOperator)
      .flatMap((organization) =>
        buildIncidentCases(
          repository.getOrganizationSnapshot(mspOperator, organization.id),
        ),
      );
    const summary = summarizeIncidentCases(cases);

    expect(summary.totalIncidents).toBe(3);
    expect(summary.activeIncidents).toBe(2);
    expect(summary.crossDomainIncidents).toBe(2);
    expect(summary.evidenceItems).toBe(6);
    expect(summary.meanAiConfidence).toBe(83);
  });
});

describe("approval-controlled automation", () => {
  it("joins each tenant approval to its incident, runbook, and execution", () => {
    const northstar = repository.getOrganizationSnapshot(
      mspOperator,
      "org-northstar",
    );
    const [automationCase] = buildAutomationCases(northstar);

    if (!automationCase) throw new Error("Expected Northstar automation case");
    expect(automationCase.approval.status).toBe("APPROVED");
    expect(automationCase.execution?.status).toBe("SUCCEEDED");
    expect(automationCase.auditEvents).toHaveLength(2);
    expect(verificationResultFor(automationCase.runbook)).toContain("sessions");
  });

  it("allows a scoped SRE analyst and blocks read-only or mismatched roles", () => {
    const meridian = repository.getOrganizationSnapshot(mspOperator, "org-meridian");
    const [automationCase] = buildAutomationCases(meridian);
    const platformActor = demoAutomationActors.find(
      (actor) => actor.role === "PLATFORM_OPERATOR",
    );
    const sreActor = demoAutomationActors.find(
      (actor) => actor.role === "SRE_ANALYST",
    );
    const socActor = demoAutomationActors.find(
      (actor) => actor.role === "SOC_ANALYST",
    );
    const auditor = demoAutomationActors.find((actor) => actor.role === "AUDITOR");

    if (!automationCase || !platformActor || !sreActor || !socActor || !auditor) {
      throw new Error("Expected automation policy fixtures");
    }
    expect(evaluateApprovalPolicy(platformActor, automationCase).allowed).toBe(true);
    expect(evaluateApprovalPolicy(sreActor, automationCase).code).toBe(
      "ALLOW_SRE_ACTION",
    );
    expect(evaluateApprovalPolicy(socActor, automationCase).code).toBe(
      "DENY_ROLE_ACTION",
    );
    expect(evaluateApprovalPolicy(auditor, automationCase).code).toBe(
      "DENY_READ_ONLY",
    );
  });

  it("produces a deterministic linked audit sequence", () => {
    const chain = buildAuditChain(demoData.auditEvents);

    expect(chain).toHaveLength(4);
    expect(chain[0]?.previousDigest).toBe("00000000");
    expect(chain[1]?.previousDigest).toBe(chain[0]?.digest);
    expect(buildAuditChain(demoData.auditEvents)).toEqual(chain);
  });

  it("summarises pending decisions and verified executions", () => {
    const cases = repository
      .listOrganizations(mspOperator)
      .flatMap((organization) =>
        buildAutomationCases(
          repository.getOrganizationSnapshot(mspOperator, organization.id),
        ),
      );
    const summary = summarizeAutomationCases(cases);

    expect(summary.totalRequests).toBe(3);
    expect(summary.pendingRequests).toBe(2);
    expect(summary.approvedRequests).toBe(1);
    expect(summary.successfulExecutions).toBe(1);
  });
});
