import type {
  AiInvestigation,
  Asset,
  Evidence,
  Incident,
  Runbook,
  Service,
  Signal,
} from "@/domain/schemas";
import type { OrganizationSnapshot } from "@/domain/tenant-repository";

export type IncidentTimelineItem = {
  id: string;
  occurredAt: string;
  kind: "DECLARED" | "SIGNAL" | "EVIDENCE" | "AI_ANALYSIS" | "RESOLVED";
  title: string;
  detail: string;
  source: string;
  supportsHypothesis: boolean | null;
  signalId: string | null;
};

export type IncidentCase = {
  incident: Incident;
  organizationName: string;
  signals: Signal[];
  evidence: Evidence[];
  investigation: AiInvestigation | null;
  services: Service[];
  assets: Asset[];
  recommendedRunbook: Runbook | null;
  timeline: IncidentTimelineItem[];
  domains: Array<"SRE" | "SOC">;
  evidenceCoveragePercent: number;
  supportingEvidenceCount: number;
  counterEvidenceCount: number;
  stakeholderDraft: string;
};

const incidentStatusOrder: Record<Incident["status"], number> = {
  INVESTIGATING: 0,
  CONTAINED: 1,
  MONITORING: 2,
  RESOLVED: 3,
};

function buildTimeline(
  incident: Incident,
  signals: Signal[],
  evidence: Evidence[],
  investigation: AiInvestigation | null,
): IncidentTimelineItem[] {
  const timeline: IncidentTimelineItem[] = [
    {
      id: `${incident.id}-declared`,
      occurredAt: incident.startedAt,
      kind: "DECLARED",
      title: "Incident declared",
      detail: `${incident.commander} assumed incident command.`,
      source: "TrustOps incident service",
      supportsHypothesis: null,
      signalId: null,
    },
    ...signals.map((signal) => ({
      id: `timeline-${signal.id}`,
      occurredAt: signal.occurredAt,
      kind: "SIGNAL" as const,
      title: signal.title,
      detail: signal.summary,
      source: signal.source.toLowerCase().replaceAll("_", " "),
      supportsHypothesis: null,
      signalId: signal.id,
    })),
    ...evidence.map((item) => ({
      id: `timeline-${item.id}`,
      occurredAt: item.observedAt,
      kind: "EVIDENCE" as const,
      title: item.supportsHypothesis
        ? "Evidence supports the leading hypothesis"
        : "Evidence challenges the leading hypothesis",
      detail: item.statement,
      source: item.sourceLabel,
      supportsHypothesis: item.supportsHypothesis,
      signalId: item.signalId ?? null,
    })),
  ];

  if (investigation) {
    timeline.push({
      id: `timeline-${investigation.id}`,
      occurredAt: investigation.generatedAt,
      kind: "AI_ANALYSIS",
      title: "Explainable analysis generated",
      detail: investigation.hypothesis,
      source: investigation.modelLabel,
      supportsHypothesis: null,
      signalId: null,
    });
  }

  if (incident.resolvedAt) {
    timeline.push({
      id: `${incident.id}-resolved`,
      occurredAt: incident.resolvedAt,
      kind: "RESOLVED",
      title: "Incident resolved",
      detail: "Recovery was verified and the incident was closed.",
      source: "TrustOps incident service",
      supportsHypothesis: null,
      signalId: null,
    });
  }

  return timeline.sort((left, right) =>
    left.occurredAt.localeCompare(right.occurredAt),
  );
}

function createStakeholderDraft(
  organizationName: string,
  incident: Incident,
  investigation: AiInvestigation | null,
) {
  const status = incident.status.toLowerCase();
  const cause = investigation
    ? `The current evidence indicates ${investigation.hypothesis.toLowerCase()}`
    : "The response team is still validating the cause.";

  return `${organizationName} update: ${incident.title} is ${status}. ${incident.businessImpact} ${cause} Engineers are validating the evidence and no automated action will run without approval.`;
}

function findRecommendedRunbook(snapshot: OrganizationSnapshot, signals: Signal[]) {
  const hasSecuritySignal = signals.some((signal) => signal.kind === "SECURITY");
  const preferredActions: Runbook["action"][] = hasSecuritySignal
    ? ["REVOKE_TOKEN", "DISABLE_ACCOUNT", "BLOCK_ADDRESS", "ROLLBACK_DEPLOYMENT"]
    : ["RESTART_SERVICE", "ROLLBACK_DEPLOYMENT"];

  return (
    preferredActions.flatMap((action) => {
      const runbook = snapshot.runbooks.find((item) => item.action === action);
      return runbook ? [runbook] : [];
    })[0] ??
    snapshot.runbooks[0] ??
    null
  );
}

export function buildIncidentCases(snapshot: OrganizationSnapshot): IncidentCase[] {
  const signalById = new Map(snapshot.signals.map((signal) => [signal.id, signal]));
  const serviceById = new Map(
    snapshot.services.map((service) => [service.id, service]),
  );
  const assetById = new Map(snapshot.assets.map((asset) => [asset.id, asset]));

  return snapshot.incidents
    .map((incident) => {
      const signals = incident.signalIds.flatMap((id) => {
        const signal = signalById.get(id);
        return signal ? [signal] : [];
      });
      const evidence = snapshot.evidence
        .filter((item) => item.incidentId === incident.id)
        .sort((left, right) => left.observedAt.localeCompare(right.observedAt));
      const investigation =
        snapshot.aiInvestigations.find((item) => item.incidentId === incident.id) ??
        null;
      const services = incident.serviceIds.flatMap((id) => {
        const service = serviceById.get(id);
        return service ? [service] : [];
      });
      const assets = incident.assetIds.flatMap((id) => {
        const asset = assetById.get(id);
        return asset ? [asset] : [];
      });
      const domains = [
        ...(signals.some((signal) => signal.kind === "RELIABILITY")
          ? (["SRE"] as const)
          : []),
        ...(signals.some((signal) => signal.kind === "SECURITY")
          ? (["SOC"] as const)
          : []),
      ];
      const citedEvidenceCount = investigation
        ? investigation.evidenceIds.filter((id) =>
            evidence.some((item) => item.id === id),
          ).length
        : 0;

      return {
        incident,
        organizationName: snapshot.organization.shortName,
        signals,
        evidence,
        investigation,
        services,
        assets,
        recommendedRunbook: findRecommendedRunbook(snapshot, signals),
        timeline: buildTimeline(incident, signals, evidence, investigation),
        domains,
        evidenceCoveragePercent:
          evidence.length === 0
            ? 0
            : Math.round((citedEvidenceCount / evidence.length) * 100),
        supportingEvidenceCount: evidence.filter((item) => item.supportsHypothesis)
          .length,
        counterEvidenceCount: evidence.filter((item) => !item.supportsHypothesis)
          .length,
        stakeholderDraft: createStakeholderDraft(
          snapshot.organization.shortName,
          incident,
          investigation,
        ),
      } satisfies IncidentCase;
    })
    .sort((left, right) => {
      const statusDifference =
        incidentStatusOrder[left.incident.status] -
        incidentStatusOrder[right.incident.status];
      if (statusDifference !== 0) return statusDifference;
      return right.incident.startedAt.localeCompare(left.incident.startedAt);
    });
}

export function summarizeIncidentCases(cases: IncidentCase[]) {
  const investigations = cases.flatMap((item) =>
    item.investigation ? [item.investigation] : [],
  );

  return {
    totalIncidents: cases.length,
    activeIncidents: cases.filter((item) => item.incident.status !== "RESOLVED")
      .length,
    crossDomainIncidents: cases.filter((item) => item.domains.length === 2).length,
    evidenceItems: cases.reduce((total, item) => total + item.evidence.length, 0),
    meanAiConfidence:
      investigations.length === 0
        ? 0
        : Math.round(
            (investigations.reduce(
              (total, investigation) => total + investigation.confidence,
              0,
            ) /
              investigations.length) *
              100,
          ),
  };
}
