"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useRef,
  useState,
} from "react";

import { workspaceSnapshots } from "@/data/workspace-data";
import {
  buildAutomationCases,
  demoAutomationActors,
  evaluateApprovalPolicy,
  type AutomationActor,
  verificationResultFor,
} from "@/domain/automation";
import type {
  Approval,
  AuditEvent,
  AutomationExecution,
} from "@/domain/schemas";

type WorkflowActionResult = {
  ok: boolean;
  message: string;
};

type AutomationContextValue = {
  actors: AutomationActor[];
  actor: AutomationActor;
  selectActor: (actorId: string) => void;
  approvals: Approval[];
  executions: AutomationExecution[];
  auditEvents: AuditEvent[];
  decideApproval: (
    approvalId: string,
    decision: "APPROVED" | "REJECTED",
    rationale: string,
  ) => WorkflowActionResult;
  runSimulation: (approvalId: string) => WorkflowActionResult;
  resetDemo: () => void;
};

const snapshots = [...workspaceSnapshots.values()];
const seedApprovals = snapshots.flatMap((snapshot) => snapshot.approvals);
const seedExecutions = snapshots.flatMap((snapshot) => snapshot.automationExecutions);
const seedAuditEvents = snapshots.flatMap((snapshot) => snapshot.auditEvents);

function copyApprovals() {
  return seedApprovals.map((approval) => ({ ...approval }));
}

function copyExecutions() {
  return seedExecutions.map((execution) => ({ ...execution }));
}

function copyAuditEvents() {
  return seedAuditEvents.map((event) => ({ ...event }));
}

const AutomationContext = createContext<AutomationContextValue | null>(null);

export function AutomationProvider({ children }: { children: ReactNode }) {
  const [actorId, setActorId] = useState(demoAutomationActors[0]?.id ?? "");
  const [approvals, setApprovals] = useState<Approval[]>(copyApprovals);
  const [executions, setExecutions] =
    useState<AutomationExecution[]>(copyExecutions);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>(copyAuditEvents);
  const runningTimers = useRef<number[]>([]);

  const actor =
    demoAutomationActors.find((item) => item.id === actorId) ??
    demoAutomationActors[0];

  if (!actor) {
    throw new Error("TrustOps requires at least one demonstration actor");
  }

  function findCase(approvalId: string) {
    return snapshots
      .flatMap((snapshot) =>
        buildAutomationCases(snapshot, approvals, executions, auditEvents),
      )
      .find((item) => item.approval.id === approvalId);
  }

  function decideApproval(
    approvalId: string,
    decision: "APPROVED" | "REJECTED",
    rationale: string,
  ): WorkflowActionResult {
    const automationCase = findCase(approvalId);
    if (!automationCase) {
      return { ok: false, message: "Approval request was not found." };
    }

    const policy = evaluateApprovalPolicy(actor, automationCase);
    if (!policy.allowed) {
      return { ok: false, message: policy.explanation };
    }

    const normalizedRationale = rationale.trim();
    if (normalizedRationale.length < 10) {
      return {
        ok: false,
        message: "Record at least 10 characters of decision rationale.",
      };
    }

    const decidedAt = "2026-08-20T03:00:00Z";
    setApprovals((current) =>
      current.map((approval) =>
        approval.id === approvalId
          ? {
              ...approval,
              status: decision,
              decidedAt,
              decidedBy: actor.name,
              rationale: normalizedRationale,
            }
          : approval,
      ),
    );
    setAuditEvents((current) => [
      ...current,
      {
        id: `audit-${approvalId}-${decision.toLowerCase()}`,
        organizationId: automationCase.organizationId,
        occurredAt: decidedAt,
        actor: actor.name,
        actorType: "USER",
        action: decision === "APPROVED" ? "APPROVE_RUNBOOK" : "REJECT_RUNBOOK",
        targetType: "approval",
        targetId: approvalId,
        outcome: "ALLOWED",
        summary: `${decision === "APPROVED" ? "Approved" : "Rejected"} simulated ${automationCase.runbook.name.toLowerCase()}: ${normalizedRationale}`,
      },
    ]);

    return {
      ok: true,
      message:
        decision === "APPROVED"
          ? "Approval recorded. The simulation is ready to run."
          : "Rejection recorded. No action can run.",
    };
  }

  function runSimulation(approvalId: string): WorkflowActionResult {
    const automationCase = findCase(approvalId);
    if (!automationCase) {
      return { ok: false, message: "Approval request was not found." };
    }
    if (automationCase.approval.status !== "APPROVED") {
      return {
        ok: false,
        message: "A recorded approval is required before simulation.",
      };
    }
    if (automationCase.execution) {
      return {
        ok: false,
        message: "This approved request already has an execution record.",
      };
    }

    const executionId = `execution-${approvalId}-demo`;
    const startedAt = "2026-08-20T03:01:00Z";
    const execution: AutomationExecution = {
      id: executionId,
      organizationId: automationCase.organizationId,
      incidentId: automationCase.incident.id,
      runbookId: automationCase.runbook.id,
      approvalId,
      status: "RUNNING",
      startedAt,
      simulated: true,
    };

    setExecutions((current) => [...current, execution]);
    setAuditEvents((current) => [
      ...current,
      {
        id: `audit-${executionId}-start`,
        organizationId: automationCase.organizationId,
        occurredAt: startedAt,
        actor: "TrustOps automation simulator",
        actorType: "SYSTEM",
        action: "START_SIMULATED_RUNBOOK",
        targetType: "automationExecution",
        targetId: executionId,
        outcome: "ALLOWED",
        summary: `Started approved simulation for ${automationCase.runbook.name.toLowerCase()}.`,
      },
    ]);

    const timer = window.setTimeout(() => {
      const completedAt = "2026-08-20T03:02:00Z";
      const verificationResult = verificationResultFor(automationCase.runbook);
      setExecutions((current) =>
        current.map((item) =>
          item.id === executionId
            ? {
                ...item,
                status: "SUCCEEDED",
                completedAt,
                verificationResult,
              }
            : item,
        ),
      );
      setAuditEvents((current) => [
        ...current,
        {
          id: `audit-${executionId}-verify`,
          organizationId: automationCase.organizationId,
          occurredAt: completedAt,
          actor: "TrustOps verification engine",
          actorType: "SYSTEM",
          action: "VERIFY_SIMULATED_RUNBOOK",
          targetType: "automationExecution",
          targetId: executionId,
          outcome: "SUCCEEDED",
          summary: verificationResult,
        },
      ]);
    }, 700);
    runningTimers.current.push(timer);

    return {
      ok: true,
      message: "Approved runbook simulation started.",
    };
  }

  function resetDemo() {
    for (const timer of runningTimers.current) window.clearTimeout(timer);
    runningTimers.current = [];
    setActorId(demoAutomationActors[0]?.id ?? "");
    setApprovals(copyApprovals());
    setExecutions(copyExecutions());
    setAuditEvents(copyAuditEvents());
  }

  const value: AutomationContextValue = {
    actors: demoAutomationActors,
    actor,
    selectActor: setActorId,
    approvals,
    executions,
    auditEvents,
    decideApproval,
    runSimulation,
    resetDemo,
  };

  return (
    <AutomationContext.Provider value={value}>
      {children}
    </AutomationContext.Provider>
  );
}

export function useAutomation() {
  const context = useContext(AutomationContext);
  if (!context) {
    throw new Error("useAutomation must be used inside AutomationProvider");
  }
  return context;
}
