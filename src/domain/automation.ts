import type {
  Approval,
  AuditEvent,
  AutomationExecution,
  Incident,
  Runbook,
} from "@/domain/schemas";
import type { OrganizationSnapshot } from "@/domain/tenant-repository";

export type AutomationActorRole =
  | "PLATFORM_OPERATOR"
  | "TENANT_ADMIN"
  | "SRE_ANALYST"
  | "SOC_ANALYST"
  | "AUDITOR";

export type AutomationActor = {
  id: string;
  name: string;
  role: AutomationActorRole;
  organizationIds: string[];
};

export type AutomationCase = {
  organizationId: string;
  organizationName: string;
  approval: Approval;
  incident: Incident;
  runbook: Runbook;
  execution: AutomationExecution | null;
  auditEvents: AuditEvent[];
};

export type PolicyDecision = {
  allowed: boolean;
  code:
    | "ALLOW_PLATFORM_OPERATOR"
    | "ALLOW_TENANT_ADMIN"
    | "ALLOW_SRE_ACTION"
    | "ALLOW_SOC_ACTION"
    | "DENY_TENANT_SCOPE"
    | "DENY_READ_ONLY"
    | "DENY_ROLE_ACTION"
    | "DENY_HIGH_RISK"
    | "DENY_NOT_PENDING";
  explanation: string;
};

const sreActions = new Set<Runbook["action"]>([
  "RESTART_SERVICE",
  "ROLLBACK_DEPLOYMENT",
]);
const socActions = new Set<Runbook["action"]>([
  "DISABLE_ACCOUNT",
  "REVOKE_TOKEN",
  "BLOCK_ADDRESS",
]);

export const demoAutomationActors: AutomationActor[] = [
  {
    id: "actor-priya-nair",
    name: "Priya Nair",
    role: "PLATFORM_OPERATOR",
    organizationIds: ["org-meridian", "org-harbourcare", "org-northstar"],
  },
  {
    id: "actor-leo-tan",
    name: "Leo Tan",
    role: "SRE_ANALYST",
    organizationIds: ["org-meridian", "org-harbourcare"],
  },
  {
    id: "actor-nadia-aziz",
    name: "Nadia Aziz",
    role: "SOC_ANALYST",
    organizationIds: ["org-meridian", "org-northstar"],
  },
  {
    id: "actor-oliver-goh",
    name: "Oliver Goh",
    role: "AUDITOR",
    organizationIds: ["org-meridian", "org-harbourcare", "org-northstar"],
  },
];

export function buildAutomationCases(
  snapshot: OrganizationSnapshot,
  approvals: Approval[] = snapshot.approvals,
  executions: AutomationExecution[] = snapshot.automationExecutions,
  auditEvents: AuditEvent[] = snapshot.auditEvents,
): AutomationCase[] {
  const incidentById = new Map(
    snapshot.incidents.map((incident) => [incident.id, incident]),
  );
  const runbookById = new Map(
    snapshot.runbooks.map((runbook) => [runbook.id, runbook]),
  );

  return approvals
    .filter((approval) => approval.organizationId === snapshot.organization.id)
    .flatMap((approval) => {
      const incident = incidentById.get(approval.incidentId);
      const runbook = runbookById.get(approval.runbookId);
      if (!incident || !runbook) return [];

      const execution =
        executions.find((item) => item.approvalId === approval.id) ?? null;
      const relatedTargetIds = new Set([
        approval.id,
        incident.id,
        ...(execution ? [execution.id] : []),
      ]);

      return [
        {
          organizationId: snapshot.organization.id,
          organizationName: snapshot.organization.shortName,
          approval,
          incident,
          runbook,
          execution,
          auditEvents: auditEvents
            .filter(
              (event) =>
                event.organizationId === snapshot.organization.id &&
                relatedTargetIds.has(event.targetId),
            )
            .sort((left, right) => left.occurredAt.localeCompare(right.occurredAt)),
        },
      ];
    })
    .sort((left, right) => {
      const pendingDifference =
        Number(right.approval.status === "PENDING") -
        Number(left.approval.status === "PENDING");
      if (pendingDifference !== 0) return pendingDifference;
      return right.approval.requestedAt.localeCompare(left.approval.requestedAt);
    });
}

export function evaluateApprovalPolicy(
  actor: AutomationActor,
  automationCase: AutomationCase,
): PolicyDecision {
  if (!actor.organizationIds.includes(automationCase.organizationId)) {
    return {
      allowed: false,
      code: "DENY_TENANT_SCOPE",
      explanation: "The actor is not assigned to this tenant.",
    };
  }

  if (automationCase.approval.status !== "PENDING") {
    return {
      allowed: false,
      code: "DENY_NOT_PENDING",
      explanation: "This request already has a recorded decision.",
    };
  }

  if (actor.role === "AUDITOR") {
    return {
      allowed: false,
      code: "DENY_READ_ONLY",
      explanation: "Auditors can inspect evidence but cannot make decisions.",
    };
  }

  if (automationCase.runbook.risk === "HIGH" && actor.role !== "TENANT_ADMIN") {
    return {
      allowed: false,
      code: "DENY_HIGH_RISK",
      explanation: "High-risk actions require an assigned tenant administrator.",
    };
  }

  if (actor.role === "PLATFORM_OPERATOR") {
    return {
      allowed: true,
      code: "ALLOW_PLATFORM_OPERATOR",
      explanation: "Platform operator is authorised for scoped low and medium-risk actions.",
    };
  }

  if (actor.role === "TENANT_ADMIN") {
    return {
      allowed: true,
      code: "ALLOW_TENANT_ADMIN",
      explanation: "Tenant administrator is authorised for this organisation.",
    };
  }

  if (actor.role === "SRE_ANALYST" && sreActions.has(automationCase.runbook.action)) {
    return {
      allowed: true,
      code: "ALLOW_SRE_ACTION",
      explanation: "SRE analyst is assigned to this tenant and runbook action family.",
    };
  }

  if (actor.role === "SOC_ANALYST" && socActions.has(automationCase.runbook.action)) {
    return {
      allowed: true,
      code: "ALLOW_SOC_ACTION",
      explanation: "SOC analyst is assigned to this tenant and runbook action family.",
    };
  }

  return {
    allowed: false,
    code: "DENY_ROLE_ACTION",
    explanation: `${actor.role.toLowerCase().replaceAll("_", " ")} is not authorised for ${automationCase.runbook.action.toLowerCase().replaceAll("_", " ")}.`,
  };
}

export function verificationResultFor(runbook: Runbook) {
  const results: Record<Runbook["action"], string> = {
    DISABLE_ACCOUNT: "Target account disabled; existing sessions rejected.",
    REVOKE_TOKEN: "All existing sessions rejected; fresh MFA sign-in required.",
    BLOCK_ADDRESS: "Address denied at the simulated edge; no matching traffic observed.",
    RESTART_SERVICE: "Consumer restarted; queue lag returned below the service threshold.",
    ROLLBACK_DEPLOYMENT:
      "Previous configuration restored; error rate and tracking latency returned within SLO.",
  };

  return results[runbook.action];
}

function simpleDigest(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function buildAuditChain(events: AuditEvent[]) {
  let previousDigest = "00000000";

  return [...events]
    .sort((left, right) => left.occurredAt.localeCompare(right.occurredAt))
    .map((event, index) => {
      const digest = simpleDigest(
        [
          previousDigest,
          event.id,
          event.organizationId,
          event.occurredAt,
          event.actor,
          event.action,
          event.targetId,
          event.outcome,
          event.summary,
        ].join("|"),
      );
      const item = {
        sequence: index + 1,
        event,
        previousDigest,
        digest,
      };
      previousDigest = digest;
      return item;
    });
}

export function summarizeAutomationCases(cases: AutomationCase[]) {
  return {
    totalRequests: cases.length,
    pendingRequests: cases.filter((item) => item.approval.status === "PENDING").length,
    approvedRequests: cases.filter((item) => item.approval.status === "APPROVED")
      .length,
    rejectedRequests: cases.filter((item) => item.approval.status === "REJECTED")
      .length,
    successfulExecutions: cases.filter(
      (item) => item.execution?.status === "SUCCEEDED",
    ).length,
  };
}
