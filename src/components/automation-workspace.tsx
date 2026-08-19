"use client";

import {
  AlertTriangle,
  BadgeCheck,
  Ban,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Fingerprint,
  LockKeyhole,
  Play,
  RotateCcw,
  ShieldCheck,
  UserCheck,
  UserRoundCog,
  Workflow,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";

import { useAutomation } from "@/components/automation-provider";
import { useWorkspace } from "@/components/workspace-provider";
import {
  buildAutomationCases,
  evaluateApprovalPolicy,
  summarizeAutomationCases,
  type AutomationCase,
} from "@/domain/automation";
import type { Approval, AutomationExecution } from "@/domain/schemas";

type DecisionIntent = "APPROVED" | "REJECTED";

const approvalStyles: Record<Approval["status"], string> = {
  PENDING: "bg-[#fff4df] text-[#a66317]",
  APPROVED: "bg-[#e7f7f2] text-[#087060]",
  REJECTED: "bg-[#ffe8e8] text-[#b63f46]",
  EXPIRED: "bg-[#edf3f5] text-muted",
};

const executionStyles: Record<AutomationExecution["status"], string> = {
  QUEUED: "bg-[#edf3f5] text-muted",
  RUNNING: "bg-[#edf0ff] text-[#405fa4]",
  SUCCEEDED: "bg-[#e7f7f2] text-[#087060]",
  FAILED: "bg-[#ffe8e8] text-[#b63f46]",
  ROLLED_BACK: "bg-[#fff4df] text-[#a66317]",
};

function formatValue(value: string) {
  return value.toLowerCase().replaceAll("_", " ");
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-SG", {
    timeZone: "Asia/Singapore",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function DecisionModal({
  automationCase,
  intent,
  rationale,
  setRationale,
  close,
  confirm,
}: {
  automationCase: AutomationCase;
  intent: DecisionIntent;
  rationale: string;
  setRationale: (value: string) => void;
  close: () => void;
  confirm: () => void;
}) {
  const approving = intent === "APPROVED";

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[#071923]/60 p-4 backdrop-blur-sm sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="decision-title"
        className="w-full max-w-xl overflow-hidden rounded-[26px] border border-white/10 bg-surface shadow-[0_30px_100px_rgba(7,25,35,0.35)]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line p-5 sm:p-6">
          <div>
            <p className={`text-[10px] font-bold uppercase tracking-[0.16em] ${approving ? "text-brand" : "text-[#b63f46]"}`}>
              Human decision
            </p>
            <h2 id="decision-title" className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-ink">
              {approving ? "Approve simulation" : "Reject request"}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close decision dialog"
            className="flex size-10 items-center justify-center rounded-xl bg-[#eef3f4] text-muted transition hover:text-ink"
            onClick={close}
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6">
          <div className="rounded-2xl border border-line bg-[#f8fafb] p-4">
            <p className="text-sm font-semibold text-ink">{automationCase.runbook.name}</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              {automationCase.runbook.description}
            </p>
          </div>

          <label htmlFor="decision-rationale" className="mt-5 block text-xs font-bold uppercase tracking-[0.12em] text-muted">
            Decision rationale
          </label>
          <textarea
            id="decision-rationale"
            value={rationale}
            onChange={(event) => setRationale(event.target.value)}
            rows={4}
            className="mt-2 w-full resize-none rounded-2xl border border-line bg-white px-4 py-3 text-sm leading-6 text-foreground outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
            placeholder="Record the evidence and reason for this decision."
          />
          <p className="mt-2 text-xs text-muted">Minimum 10 characters. This becomes an audit event.</p>

          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" className="rounded-xl border border-line px-5 py-3 text-sm font-semibold text-muted transition hover:text-ink" onClick={close}>
              Cancel
            </button>
            <button
              type="button"
              className={`rounded-xl px-5 py-3 text-sm font-semibold text-white transition ${approving ? "bg-brand hover:bg-brand-strong" : "bg-[#b63f46] hover:bg-[#94333a]"}`}
              onClick={confirm}
            >
              {approving ? "Record approval" : "Record rejection"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkflowProgress({ automationCase }: { automationCase: AutomationCase }) {
  const steps = [
    {
      label: "Requested",
      detail: formatDateTime(automationCase.approval.requestedAt),
      complete: true,
    },
    {
      label:
        automationCase.approval.status === "REJECTED" ? "Rejected" : "Approved",
      detail: automationCase.approval.decidedBy ?? "Awaiting authorised reviewer",
      complete: automationCase.approval.status !== "PENDING",
    },
    {
      label: "Simulated",
      detail: automationCase.execution?.startedAt
        ? formatDateTime(automationCase.execution.startedAt)
        : "Blocked until approval",
      complete: Boolean(automationCase.execution),
    },
    {
      label: "Verified",
      detail:
        automationCase.execution?.status === "SUCCEEDED"
          ? "Recovery checks passed"
          : "No verified outcome",
      complete: automationCase.execution?.status === "SUCCEEDED",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-4">
      {steps.map((step, index) => (
        <div key={step.label} className="relative rounded-2xl border border-line bg-[#f8fafb] p-4">
          <div className="flex items-center justify-between gap-2">
            <span className={`flex size-7 items-center justify-center rounded-full ${step.complete ? "bg-brand text-white" : "bg-[#e4ebed] text-muted"}`}>
              {step.complete ? <Check className="size-4" /> : <span className="text-[10px] font-bold">{index + 1}</span>}
            </span>
            {index < steps.length - 1 ? <ChevronRight className="hidden size-4 text-line sm:block" /> : null}
          </div>
          <p className="mt-3 text-sm font-semibold text-ink">{step.label}</p>
          <p className="mt-1 text-[11px] leading-5 text-muted">{step.detail}</p>
        </div>
      ))}
    </div>
  );
}

export function AutomationWorkspace() {
  const { selection, visibleSnapshots } = useWorkspace();
  const {
    actors,
    actor,
    selectActor,
    approvals,
    executions,
    auditEvents,
    decideApproval,
    runSimulation,
    resetDemo,
  } = useAutomation();
  const [requestedApprovalId, setRequestedApprovalId] = useState<string | null>(null);
  const [decisionIntent, setDecisionIntent] = useState<DecisionIntent | null>(null);
  const [rationale, setRationale] = useState("");
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  const automationCases = useMemo(
    () =>
      visibleSnapshots.flatMap((snapshot) =>
        buildAutomationCases(snapshot, approvals, executions, auditEvents),
      ),
    [visibleSnapshots, approvals, executions, auditEvents],
  );
  const selectedCase =
    automationCases.find((item) => item.approval.id === requestedApprovalId) ??
    automationCases[0];
  const summary = summarizeAutomationCases(automationCases);
  const policy = selectedCase
    ? evaluateApprovalPolicy(actor, selectedCase)
    : null;

  function openDecision(intent: DecisionIntent) {
    if (!selectedCase) return;
    setFeedback(null);
    setRationale(
      intent === "APPROVED"
        ? `Reviewed incident evidence and ${selectedCase.runbook.risk.toLowerCase()}-risk verification plan.`
        : "Evidence is insufficient for the proposed action at this time.",
    );
    setDecisionIntent(intent);
  }

  function confirmDecision() {
    if (!selectedCase || !decisionIntent) return;
    const result = decideApproval(selectedCase.approval.id, decisionIntent, rationale);
    setFeedback(result);
    if (result.ok) setDecisionIntent(null);
  }

  function startSimulation() {
    if (!selectedCase) return;
    setFeedback(runSimulation(selectedCase.approval.id));
  }

  if (!selectedCase) {
    return <div className="rounded-[24px] border border-line bg-surface p-8 text-center text-sm text-muted">No automation requests are available in this workspace.</div>;
  }

  const execution = selectedCase.execution;
  const pending = selectedCase.approval.status === "PENDING";
  const decisionRecorded = !pending;
  const canExecute = selectedCase.approval.status === "APPROVED" && !execution;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[28px] bg-[#0b2027] text-white shadow-[0_24px_65px_rgba(7,25,35,0.16)]">
        <div className="absolute -right-24 -top-32 size-80 rounded-full border-[58px] border-[#0b806f]/25" />
        <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_330px] lg:p-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8fe8d5]">
              <Workflow className="size-3.5" /> Controlled automation
            </div>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-[#8da2ac]">Human policy gate</p>
            <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-[1.05] tracking-[-0.05em] sm:text-4xl lg:text-5xl">
              Automation earns trust <span className="text-[#62e0c8]">one approved step at a time.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-[#b4c1c7] sm:text-base">
              Every runbook is role-checked, tenant-scoped, simulated, verified,
              and recorded before TrustOps declares success.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8da2ac]">Acting as</p>
                <p className="mt-2 text-lg font-semibold">{actor.name}</p>
              </div>
              <span className="flex size-11 items-center justify-center rounded-xl bg-[#62e0c8]/10 text-[#62e0c8]"><Fingerprint className="size-6" /></span>
            </div>
            <label htmlFor="automation-actor" className="sr-only">Demonstration actor</label>
            <select
              id="automation-actor"
              value={actor.id}
              onChange={(event) => {
                selectActor(event.target.value);
                setFeedback(null);
              }}
              className="mt-5 w-full rounded-xl border border-white/10 bg-[#122f37] px-3 py-3 text-sm text-white outline-none"
            >
              {actors.map((item) => (
                <option key={item.id} value={item.id}>{item.name} · {formatValue(item.role)}</option>
              ))}
            </select>
            <p className="mt-3 text-xs leading-5 text-[#a9bbc2]">Switch roles to demonstrate policy enforcement and read-only audit access.</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Automation KPIs">
        {[
          { label: "Pending decisions", value: summary.pendingRequests, detail: `${summary.totalRequests} requests in scope`, icon: Clock3 },
          { label: "Approved", value: summary.approvedRequests, detail: "Human decisions recorded", icon: UserCheck },
          { label: "Verified recovery", value: summary.successfulExecutions, detail: "Simulated outcomes passed", icon: BadgeCheck },
          { label: "Guardrail", value: "100%", detail: "Runbooks require approval", icon: LockKeyhole },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.label} className="rounded-[22px] border border-line bg-surface p-5 shadow-[0_12px_35px_rgba(29,58,68,0.05)]">
              <div className="flex items-start justify-between gap-4">
                <div><p className="text-xs font-medium text-muted">{item.label}</p><p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-ink">{item.value}</p></div>
                <span className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand-strong"><Icon className="size-5" /></span>
              </div>
              <p className="mt-4 text-xs text-muted">{item.detail}</p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <article className="self-start rounded-[24px] border border-line bg-surface p-4 shadow-[0_18px_50px_rgba(29,58,68,0.06)] xl:sticky xl:top-24">
          <div className="p-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand">Approval queue</p>
            <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-ink">Proposed actions</h2>
            <p className="mt-1 text-xs text-muted">{selection === "portfolio" ? "All authorised organisations" : "Selected tenant only"}</p>
          </div>
          <div className="mt-3 space-y-2">
            {automationCases.map((item) => {
              const active = item.approval.id === selectedCase.approval.id;
              return (
                <button
                  key={item.approval.id}
                  type="button"
                  onClick={() => { setRequestedApprovalId(item.approval.id); setFeedback(null); }}
                  className={`w-full rounded-2xl border p-4 text-left transition ${active ? "border-[#91cfc2] bg-[#eff9f7]" : "border-line bg-white hover:border-[#b8c9cc]"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.1em] ${approvalStyles[item.approval.status]}`}>{item.approval.status}</span>
                    <ChevronRight className="size-4 text-muted" />
                  </div>
                  <p className="mt-3 text-sm font-semibold leading-5 text-ink">{item.runbook.name}</p>
                  <p className="mt-2 text-[11px] text-muted">{item.organizationName} · {item.runbook.risk} risk</p>
                </button>
              );
            })}
          </div>
        </article>

        <div className="min-w-0 space-y-5">
          <article className="overflow-hidden rounded-[24px] border border-line bg-surface shadow-[0_18px_50px_rgba(29,58,68,0.06)]">
            <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_270px]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${approvalStyles[selectedCase.approval.status]}`}>{selectedCase.approval.status}</span>
                  <span className="rounded-full bg-[#edf0ff] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#405fa4]">{formatValue(selectedCase.runbook.action)}</span>
                  <span className="rounded-full bg-[#fff4df] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#a66317]">{selectedCase.runbook.risk} risk</span>
                </div>
                <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted">{selectedCase.organizationName} · {selectedCase.incident.id}</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-ink sm:text-3xl">{selectedCase.runbook.name}</h2>
                <p className="mt-4 text-sm leading-6 text-foreground">{selectedCase.runbook.description}</p>
                <p className="mt-4 text-sm leading-6 text-muted"><span className="font-semibold text-ink">Incident:</span> {selectedCase.incident.title}</p>
              </div>
              <div className={`rounded-2xl border p-4 ${policy?.allowed || decisionRecorded ? "border-[#cce7e0] bg-[#ecf8f5]" : "border-[#efdcb8] bg-[#fffaf1]"}`}>
                <div className="flex items-center gap-2">
                  {decisionRecorded ? <BadgeCheck className="size-5 text-brand" /> : policy?.allowed ? <ShieldCheck className="size-5 text-brand" /> : <Ban className="size-5 text-[#a66317]" />}
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-ink">Policy decision</p>
                </div>
                <p className={`mt-3 text-lg font-semibold ${policy?.allowed || decisionRecorded ? "text-brand-strong" : "text-[#a66317]"}`}>{decisionRecorded ? "Decision recorded" : policy?.allowed ? "Allowed" : "Blocked"}</p>
                <p className="mt-2 text-xs leading-5 text-muted">{decisionRecorded ? `The ${selectedCase.approval.status.toLowerCase()} human decision is immutable in this demonstration.` : policy?.explanation}</p>
                <p className="mt-3 font-mono text-[10px] text-muted">{decisionRecorded ? "RECORDED_HUMAN_DECISION" : policy?.code}</p>
              </div>
            </div>

            <div className="border-t border-line p-5 sm:p-7">
              <WorkflowProgress automationCase={selectedCase} />
            </div>
          </article>

          {feedback ? (
            <div role="status" className={`flex items-start gap-3 rounded-2xl border p-4 text-sm ${feedback.ok ? "border-[#cce7e0] bg-[#ecf8f5] text-brand-strong" : "border-[#f0c9c9] bg-[#fff2f2] text-[#a63d43]"}`}>
              {feedback.ok ? <CheckCircle2 className="mt-0.5 size-5 shrink-0" /> : <AlertTriangle className="mt-0.5 size-5 shrink-0" />}
              {feedback.message}
            </div>
          ) : null}

          <section className="grid gap-5 lg:grid-cols-2">
            <article className="rounded-[24px] border border-line bg-surface p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand">Decision gate</p><h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-ink">Human approval</h2></div>
                <span className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand-strong"><UserRoundCog className="size-5" /></span>
              </div>
              {pending ? (
                <>
                  <p className="mt-4 text-sm leading-6 text-muted">Requested by {selectedCase.approval.requestedBy} at {formatDateTime(selectedCase.approval.requestedAt)}.</p>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <button type="button" disabled={!policy?.allowed} onClick={() => openDecision("REJECTED")} className="flex items-center justify-center gap-2 rounded-xl border border-[#efcaca] px-4 py-3 text-sm font-semibold text-[#b63f46] transition enabled:hover:bg-[#fff2f2] disabled:cursor-not-allowed disabled:opacity-40"><XCircle className="size-4" /> Reject</button>
                    <button type="button" disabled={!policy?.allowed} onClick={() => openDecision("APPROVED")} className="flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition enabled:hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-40"><UserCheck className="size-4" /> Approve</button>
                  </div>
                </>
              ) : (
                <div className="mt-5 rounded-2xl border border-line bg-[#f8fafb] p-4">
                  <p className="text-sm font-semibold text-ink">Decision by {selectedCase.approval.decidedBy}</p>
                  <p className="mt-2 text-sm leading-6 text-muted">{selectedCase.approval.rationale}</p>
                </div>
              )}
            </article>

            <article className="rounded-[24px] border border-line bg-surface p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#405fa4]">Execution sandbox</p><h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-ink">Simulate and verify</h2></div>
                <span className="flex size-10 items-center justify-center rounded-xl bg-[#edf0ff] text-[#405fa4]"><Zap className="size-5" /></span>
              </div>
              {execution ? (
                <div className="mt-5">
                  <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${executionStyles[execution.status]}`}>{execution.status}</span>
                  <p className="mt-4 text-sm font-semibold text-ink">{execution.status === "RUNNING" ? "Applying simulated steps…" : "Verification result"}</p>
                  <p className="mt-2 text-sm leading-6 text-muted">{execution.verificationResult ?? "The controlled demonstration is running. No real system is connected."}</p>
                </div>
              ) : (
                <>
                  <p className="mt-4 text-sm leading-6 text-muted">Execution remains unavailable until an authorised actor records approval.</p>
                  <button type="button" disabled={!canExecute} onClick={startSimulation} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#405fa4] px-4 py-3 text-sm font-semibold text-white transition enabled:hover:bg-[#344e87] disabled:cursor-not-allowed disabled:opacity-40"><Play className="size-4" /> Run approved simulation</button>
                </>
              )}
            </article>
          </section>

          <article className="rounded-[24px] border border-line bg-surface p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand">Verification plan</p><h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-ink">Measured recovery checks</h2></div>
              <button type="button" onClick={() => { resetDemo(); setFeedback({ ok: true, message: "Demonstration workflow reset to its seeded state." }); setRequestedApprovalId(null); }} className="flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-xs font-semibold text-muted transition hover:text-ink"><RotateCcw className="size-4" /> Reset demo</button>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {selectedCase.runbook.verificationSteps.map((step, index) => {
                const passed = execution?.status === "SUCCEEDED";
                return <div key={step} className="rounded-2xl border border-line bg-[#f8fafb] p-4"><span className={`flex size-8 items-center justify-center rounded-xl ${passed ? "bg-brand text-white" : "bg-[#e6edef] text-muted"}`}>{passed ? <Check className="size-4" /> : <span className="text-xs font-bold">{index + 1}</span>}</span><p className="mt-3 text-sm font-semibold text-ink">{step}</p><p className="mt-1 text-xs text-muted">{passed ? "Passed in simulation" : "Awaiting execution"}</p></div>;
              })}
            </div>
          </article>
        </div>
      </section>

      {decisionIntent ? (
        <DecisionModal automationCase={selectedCase} intent={decisionIntent} rationale={rationale} setRationale={setRationale} close={() => setDecisionIntent(null)} confirm={confirmDecision} />
      ) : null}
    </div>
  );
}
