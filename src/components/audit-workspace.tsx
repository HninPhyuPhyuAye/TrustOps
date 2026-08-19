"use client";

import {
  Bot,
  Clock3,
  Download,
  FileLock2,
  RotateCcw,
  ScrollText,
  ShieldCheck,
  UserRound,
  Workflow,
} from "lucide-react";
import { useMemo, useState } from "react";

import { useAutomation } from "@/components/automation-provider";
import { useWorkspace } from "@/components/workspace-provider";
import { buildAuditChain } from "@/domain/automation";
import type { AuditEvent } from "@/domain/schemas";

type ActorFilter = "ALL" | AuditEvent["actorType"];

const outcomeStyles: Record<AuditEvent["outcome"], string> = {
  ALLOWED: "bg-[#e7f7f2] text-[#087060]",
  DENIED: "bg-[#fff4df] text-[#a66317]",
  SUCCEEDED: "bg-[#e7f7f2] text-[#087060]",
  FAILED: "bg-[#ffe8e8] text-[#b63f46]",
};

const actorIcons: Record<AuditEvent["actorType"], typeof UserRound> = {
  USER: UserRound,
  SYSTEM: Workflow,
  AI_AGENT: Bot,
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
    second: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

export function AuditWorkspace() {
  const { selection, visibleSnapshots } = useWorkspace();
  const { auditEvents, resetDemo } = useAutomation();
  const [actorFilter, setActorFilter] = useState<ActorFilter>("ALL");
  const visibleOrganizationIds = useMemo(
    () => new Set(visibleSnapshots.map((snapshot) => snapshot.organization.id)),
    [visibleSnapshots],
  );
  const scopedEvents = useMemo(
    () =>
      auditEvents.filter((event) =>
        visibleOrganizationIds.has(event.organizationId),
      ),
    [auditEvents, visibleOrganizationIds],
  );
  const chain = buildAuditChain(scopedEvents)
    .filter(
      (item) =>
        actorFilter === "ALL" || item.event.actorType === actorFilter,
    )
    .reverse();
  const organizationNames = new Map(
    visibleSnapshots.map((snapshot) => [
      snapshot.organization.id,
      snapshot.organization.shortName,
    ]),
  );

  function exportAuditEvidence() {
    const payload = JSON.stringify(
      chain.map((item) => ({
        sequence: item.sequence,
        digest: item.digest,
        previousDigest: item.previousDigest,
        ...item.event,
      })),
      null,
      2,
    );
    const url = URL.createObjectURL(
      new Blob([payload], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `trustops-audit-${selection}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const actorCounts = {
    users: scopedEvents.filter((event) => event.actorType === "USER").length,
    systems: scopedEvents.filter((event) => event.actorType === "SYSTEM").length,
    ai: scopedEvents.filter((event) => event.actorType === "AI_AGENT").length,
  };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[28px] bg-[#111b29] text-white shadow-[0_24px_65px_rgba(7,25,35,0.16)]">
        <div className="absolute -right-24 -top-28 size-72 rounded-full bg-[#405fa4]/20" />
        <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_320px] lg:p-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#b8c7ff]">
              <ScrollText className="size-3.5" /> Governance evidence
            </div>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-[#8da2ac]">Audit history</p>
            <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-[1.05] tracking-[-0.05em] sm:text-4xl lg:text-5xl">
              Make every decision <span className="text-[#9cb2f1]">reconstructable.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-[#b4c1c7] sm:text-base">
              Actor, tenant, action, outcome, and verification evidence remain in
              one append-only-style demonstration trail.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
            <div className="flex items-center justify-between gap-4">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8da2ac]">Integrity view</p><p className="mt-2 text-lg font-semibold">Chain intact</p></div>
              <span className="flex size-11 items-center justify-center rounded-xl bg-[#9cb2f1]/10 text-[#9cb2f1]"><FileLock2 className="size-6" /></span>
            </div>
            <p className="mt-5 border-t border-white/10 pt-4 text-xs leading-5 text-[#a9bbc2]">
              Demo checksums link each visible event to the previous record. They
              illustrate tamper evidence but are not a production cryptographic ledger.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Audit KPIs">
        {[
          { label: "Events in scope", value: scopedEvents.length, detail: selection === "portfolio" ? "Across authorised tenants" : "Selected tenant only", icon: ScrollText },
          { label: "Human actions", value: actorCounts.users, detail: "Attributed user decisions", icon: UserRound },
          { label: "System actions", value: actorCounts.systems, detail: "Execution and verification", icon: Workflow },
          { label: "AI proposals", value: actorCounts.ai, detail: "Recommendations, never decisions", icon: Bot },
        ].map((item) => {
          const Icon = item.icon;
          return <article key={item.label} className="rounded-[22px] border border-line bg-surface p-5 shadow-[0_12px_35px_rgba(29,58,68,0.05)]"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-medium text-muted">{item.label}</p><p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-ink">{item.value}</p></div><span className="flex size-10 items-center justify-center rounded-xl bg-[#edf0ff] text-[#405fa4]"><Icon className="size-5" /></span></div><p className="mt-4 text-xs text-muted">{item.detail}</p></article>;
        })}
      </section>

      <section className="rounded-[24px] border border-line bg-surface p-5 shadow-[0_18px_50px_rgba(29,58,68,0.06)] sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand">Append-only-style trail</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-ink">Decision and execution history</h2>
            <p className="mt-2 text-sm text-muted">Newest visible event first. Sequence numbers preserve original order.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={resetDemo} className="flex items-center gap-2 rounded-xl border border-line px-3 py-2.5 text-xs font-semibold text-muted transition hover:text-ink"><RotateCcw className="size-4" /> Reset demo</button>
            <button type="button" onClick={exportAuditEvidence} className="flex items-center gap-2 rounded-xl bg-[#405fa4] px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-[#344e87]"><Download className="size-4" /> Export JSON</button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2" aria-label="Audit actor filters">
          {(["ALL", "USER", "SYSTEM", "AI_AGENT"] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActorFilter(filter)}
              className={`rounded-full border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.1em] transition ${actorFilter === filter ? "border-brand bg-brand text-white" : "border-line text-muted hover:border-[#9bc9c0] hover:text-brand"}`}
            >
              {formatValue(filter)}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          {chain.length > 0 ? chain.map((item) => {
            const Icon = actorIcons[item.event.actorType];
            return (
              <article key={item.event.id} className="grid gap-4 rounded-2xl border border-line bg-[#f8fafb] p-4 sm:grid-cols-[48px_1fr_auto] sm:items-start">
                <span className="flex size-11 items-center justify-center rounded-xl bg-white text-[#405fa4] shadow-sm"><Icon className="size-5" /></span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#405fa4]">#{String(item.sequence).padStart(3, "0")}</span>
                    <span className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.1em] ${outcomeStyles[item.event.outcome]}`}>{item.event.outcome}</span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">{formatValue(item.event.actorType)}</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-ink">{formatValue(item.event.action)}</p>
                  <p className="mt-1 text-sm leading-6 text-foreground">{item.event.summary}</p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-muted">
                    <span>{organizationNames.get(item.event.organizationId) ?? item.event.organizationId}</span>
                    <span>{item.event.actor}</span>
                    <span>{item.event.targetType}:{item.event.targetId}</span>
                  </div>
                </div>
                <div className="sm:text-right">
                  <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-muted sm:justify-end"><Clock3 className="size-3.5" /> {formatDateTime(item.event.occurredAt)}</p>
                  <p className="mt-3 font-mono text-[10px] text-[#405fa4]">{item.previousDigest} → {item.digest}</p>
                </div>
              </article>
            );
          }) : <div className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">No audit events match this filter.</div>}
        </div>
      </section>

      <article className="rounded-[24px] border border-[#cce7e0] bg-[#ecf8f5] p-5 sm:p-6">
        <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-brand" /><div><p className="text-sm font-semibold text-ink">Governance boundary</p><p className="mt-2 text-sm leading-6 text-foreground">AI agents may propose a runbook. Only an authorised human may decide. Only the simulator may execute in this portfolio environment, and verification creates a separate system event.</p></div></div>
      </article>
    </div>
  );
}
