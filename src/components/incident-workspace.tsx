"use client";

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  BrainCircuit,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  FileCheck2,
  FileText,
  Gauge,
  Link2,
  LockKeyhole,
  MessageSquareText,
  Network,
  RadioTower,
  ShieldCheck,
  Sparkles,
  Target,
  UsersRound,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

import { useWorkspace } from "@/components/workspace-provider";
import {
  buildIncidentCases,
  type IncidentCase,
  type IncidentTimelineItem,
  summarizeIncidentCases,
} from "@/domain/incidents";
import type { Incident, Severity } from "@/domain/schemas";

type WorkspaceMode = "TIMELINE" | "ANALYSIS";
type IncidentFilter = "ALL" | "ACTIVE" | "CROSS_DOMAIN" | "RESOLVED";

type IncidentWorkspaceProps = {
  initialMode?: WorkspaceMode;
};

const severityWeight: Record<Severity, number> = {
  INFO: 0,
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

const severityStyles: Record<Severity, string> = {
  INFO: "bg-[#edf3f5] text-muted",
  LOW: "bg-[#e7f7f2] text-[#087060]",
  MEDIUM: "bg-[#fff4df] text-[#a66317]",
  HIGH: "bg-[#ffe8e8] text-[#b63f46]",
  CRITICAL: "bg-[#7f1d26] text-white",
};

const statusStyles: Record<Incident["status"], string> = {
  INVESTIGATING: "bg-[#ffe8e8] text-[#b63f46]",
  CONTAINED: "bg-[#e8edff] text-[#405fa4]",
  MONITORING: "bg-[#fff4df] text-[#a66317]",
  RESOLVED: "bg-[#e7f7f2] text-[#087060]",
};

const timelineIcons: Record<IncidentTimelineItem["kind"], typeof CircleDot> = {
  DECLARED: RadioTower,
  SIGNAL: Activity,
  EVIDENCE: FileCheck2,
  AI_ANALYSIS: BrainCircuit,
  RESOLVED: CheckCircle2,
};

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

function formatValue(value: string) {
  return value.toLowerCase().replaceAll("_", " ");
}

function Timeline({ incidentCase }: { incidentCase: IncidentCase }) {
  return (
    <article className="overflow-hidden rounded-[24px] border border-line bg-surface shadow-[0_18px_50px_rgba(29,58,68,0.06)]">
      <div className="border-b border-line p-5 sm:p-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand">
          Unified evidence timeline
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-ink sm:text-2xl">
              What happened, in order
            </h2>
            <p className="mt-1 text-sm text-muted">
              Reliability and security observations share one clock.
            </p>
          </div>
          <span className="rounded-full bg-[#edf3f5] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
            {incidentCase.timeline.length} events
          </span>
        </div>
      </div>

      <ol className="p-5 sm:p-6">
        {incidentCase.timeline.map((item, index) => {
          const Icon = timelineIcons[item.kind];
          return (
            <li key={item.id} className="relative flex gap-4 pb-6 last:pb-0">
              {index < incidentCase.timeline.length - 1 ? (
                <span className="absolute left-[18px] top-10 h-[calc(100%-24px)] w-px bg-line" />
              ) : null}
              <span
                className={`relative z-10 flex size-9 shrink-0 items-center justify-center rounded-xl border ${
                  item.supportsHypothesis === false
                    ? "border-[#f3cf9f] bg-[#fff8ed] text-[#a66317]"
                    : item.kind === "AI_ANALYSIS"
                      ? "border-[#cbd5ff] bg-[#edf0ff] text-[#405fa4]"
                      : "border-[#cce7e0] bg-[#ecf8f5] text-brand"
                }`}
              >
                <Icon aria-hidden="true" className="size-[17px]" />
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-ink">{item.title}</p>
                  <time className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">
                    {formatDateTime(item.occurredAt)}
                  </time>
                </div>
                <p className="mt-1.5 text-sm leading-6 text-foreground">
                  {item.detail}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.1em] text-muted">
                  <span>{item.source}</span>
                  {item.supportsHypothesis === true ? (
                    <span className="rounded-full bg-[#e7f7f2] px-2 py-1 text-[#087060]">
                      Supports hypothesis
                    </span>
                  ) : null}
                  {item.supportsHypothesis === false ? (
                    <span className="rounded-full bg-[#fff4df] px-2 py-1 text-[#a66317]">
                      Counter-evidence
                    </span>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </article>
  );
}

function AiAnalysis({ incidentCase }: { incidentCase: IncidentCase }) {
  const investigation = incidentCase.investigation;

  if (!investigation) {
    return (
      <article className="rounded-[24px] border border-line bg-surface p-6">
        <p className="text-sm text-muted">No analysis is available for this incident.</p>
      </article>
    );
  }

  const citedEvidence = investigation.evidenceIds.flatMap((evidenceId) => {
    const evidence = incidentCase.evidence.find((item) => item.id === evidenceId);
    return evidence ? [evidence] : [];
  });

  return (
    <article className="overflow-hidden rounded-[24px] border border-[#cad3f1] bg-surface shadow-[0_20px_60px_rgba(53,76,139,0.1)]">
      <div className="bg-[#0d1630] p-5 text-white sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#9cb2f1]/15 text-[#adc0ff]">
              <BrainCircuit aria-hidden="true" className="size-6" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9cb2f1]">
                Explainable AI analyst
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] sm:text-2xl">
                Evidence-backed assessment
              </h2>
            </div>
          </div>
          <span className="rounded-full border border-[#9cb2f1]/25 bg-[#9cb2f1]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#c3d0ff]">
            Simulated output
          </span>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.05] p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#9cb2f1]">
            Leading hypothesis
          </p>
          <p className="mt-3 text-base font-medium leading-7 text-white sm:text-lg">
            {investigation.hypothesis}
          </p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-[10px] uppercase tracking-[0.12em] text-[#8f9ab9]">
              Confidence
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {Math.round(investigation.confidence * 100)}%
            </p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[#9cb2f1]"
                style={{ width: `${investigation.confidence * 100}%` }}
              />
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-[10px] uppercase tracking-[0.12em] text-[#8f9ab9]">
              Evidence coverage
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {incidentCase.evidenceCoveragePercent}%
            </p>
            <p className="mt-2 text-xs text-[#aeb8d2]">
              {citedEvidence.length} source-linked citations
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-[10px] uppercase tracking-[0.12em] text-[#8f9ab9]">
              Human decision
            </p>
            <p className="mt-2 text-lg font-semibold">Required</p>
            <p className="mt-2 text-xs text-[#aeb8d2]">No autonomous action</p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-5 sm:p-7 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="flex items-center gap-2">
            <Link2 aria-hidden="true" className="size-4 text-[#405fa4]" />
            <h3 className="text-sm font-semibold text-ink">Cited evidence</h3>
          </div>
          <div className="mt-3 space-y-3">
            {citedEvidence.map((item, index) => (
              <div key={item.id} className="rounded-2xl border border-line bg-[#f8fafc] p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#405fa4]">
                    Source {index + 1} · {item.sourceLabel}
                  </span>
                  {item.supportsHypothesis ? (
                    <Check aria-label="Supports hypothesis" className="size-4 text-brand" />
                  ) : (
                    <X aria-label="Challenges hypothesis" className="size-4 text-[#a66317]" />
                  )}
                </div>
                <p className="mt-2 text-sm leading-6 text-foreground">
                  {item.statement}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-line p-4">
            <div className="flex items-center gap-2">
              <Target aria-hidden="true" className="size-4 text-[#405fa4]" />
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">
                Blast radius
              </p>
            </div>
            <p className="mt-3 text-sm leading-6 text-foreground">
              {investigation.blastRadius}
            </p>
          </div>
          <div className="rounded-2xl border border-[#efdcb8] bg-[#fffaf1] p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle aria-hidden="true" className="size-4 text-[#a66317]" />
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#a66317]">
                Known limitations
              </p>
            </div>
            <ul className="mt-3 space-y-2">
              {investigation.limitations.map((limitation) => (
                <li key={limitation} className="flex gap-2 text-sm leading-5 text-foreground">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#d59a4f]" />
                  {limitation}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </article>
  );
}

export function IncidentWorkspace({
  initialMode = "TIMELINE",
}: IncidentWorkspaceProps) {
  const { selection, visibleSnapshots } = useWorkspace();
  const [mode, setMode] = useState<WorkspaceMode>(initialMode);
  const [filter, setFilter] = useState<IncidentFilter>("ALL");
  const [requestedIncidentId, setRequestedIncidentId] = useState<string | null>(
    null,
  );

  const incidentCases = useMemo(
    () =>
      visibleSnapshots
        .flatMap(buildIncidentCases)
        .sort((left, right) => {
          const resolvedDifference =
            Number(left.incident.status === "RESOLVED") -
            Number(right.incident.status === "RESOLVED");
          if (resolvedDifference !== 0) return resolvedDifference;
          const severityDifference =
            severityWeight[right.incident.severity] -
            severityWeight[left.incident.severity];
          if (severityDifference !== 0) return severityDifference;
          return right.incident.startedAt.localeCompare(left.incident.startedAt);
        }),
    [visibleSnapshots],
  );

  const matchesFilter = (
    incidentCase: IncidentCase,
    candidateFilter: IncidentFilter,
  ) => {
    if (candidateFilter === "ACTIVE") {
      return incidentCase.incident.status !== "RESOLVED";
    }
    if (candidateFilter === "RESOLVED") {
      return incidentCase.incident.status === "RESOLVED";
    }
    if (candidateFilter === "CROSS_DOMAIN") {
      return incidentCase.domains.length === 2;
    }
    return true;
  };
  const requestedCases = incidentCases.filter((incidentCase) =>
    matchesFilter(incidentCase, filter),
  );
  const effectiveFilter =
    filter !== "ALL" && requestedCases.length === 0 ? "ALL" : filter;
  const effectiveCases = incidentCases.filter((incidentCase) =>
    matchesFilter(incidentCase, effectiveFilter),
  );
  const selectedCase =
    effectiveCases.find(
      (incidentCase) => incidentCase.incident.id === requestedIncidentId,
    ) ?? effectiveCases[0];
  const summary = summarizeIncidentCases(incidentCases);

  const filters: Array<{ value: IncidentFilter; label: string }> = [
    { value: "ALL", label: "All incidents" },
    { value: "ACTIVE", label: "Active" },
    { value: "CROSS_DOMAIN", label: "SRE + SOC" },
    { value: "RESOLVED", label: "Resolved" },
  ];

  if (!selectedCase) {
    return (
      <div className="rounded-[24px] border border-line bg-surface p-8 text-center">
        <p className="text-sm text-muted">No incidents are available in this workspace.</p>
      </div>
    );
  }

  const runbook = selectedCase.recommendedRunbook;
  const isPortfolio = selection === "portfolio";

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[28px] bg-[#101c26] text-white shadow-[0_24px_65px_rgba(7,25,35,0.16)]">
        <div className="absolute -right-20 -top-32 size-80 rounded-full bg-[#147f70]/25" />
        <div className="absolute bottom-0 right-[24%] h-px w-64 bg-gradient-to-r from-transparent via-[#7aa8ff]/50 to-transparent" />
        <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_310px] lg:p-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#90e0d1]">
              <RadioTower aria-hidden="true" className="size-3.5" />
              Unified incident response
            </div>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-[#8da2ac]">
              {initialMode === "ANALYSIS" ? "Explainable AI" : "Incident command"}
            </p>
            <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-[1.05] tracking-[-0.05em] sm:text-4xl lg:text-5xl">
              {initialMode === "ANALYSIS" ? (
                <>
                  Show the evidence behind <span className="text-[#9cb2f1]">every AI conclusion.</span>
                </>
              ) : (
                <>
                  One incident. <span className="text-[#62e0c8]">Every operational and cyber fact.</span>
                </>
              )}
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-[#b4c1c7] sm:text-base">
              TrustOps correlates SRE and SOC signals, preserves counter-evidence,
              and gives engineers a tenant-scoped hypothesis they can challenge.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8da2ac]">
                  Analyst safety
                </p>
                <p className="mt-2 text-lg font-semibold">Human-controlled</p>
              </div>
              <span className="flex size-11 items-center justify-center rounded-xl bg-[#62e0c8]/10 text-[#62e0c8]">
                <LockKeyhole aria-hidden="true" className="size-6" />
              </span>
            </div>
            <div className="mt-5 space-y-3 border-t border-white/10 pt-4 text-xs text-[#bac7cc]">
              <p className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-[#62e0c8]" /> Source-linked evidence
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-[#62e0c8]" /> Explicit uncertainty
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-[#62e0c8]" /> Approval before action
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Incident KPIs">
        {[
          {
            label: "Active incidents",
            value: summary.activeIncidents,
            detail: `${summary.totalIncidents} total in scope`,
            icon: RadioTower,
          },
          {
            label: "Cross-domain",
            value: summary.crossDomainIncidents,
            detail: "Correlated SRE + SOC cases",
            icon: Network,
          },
          {
            label: "Evidence items",
            value: summary.evidenceItems,
            detail: "Chronological source records",
            icon: FileCheck2,
          },
          {
            label: "Mean AI confidence",
            value: `${summary.meanAiConfidence}%`,
            detail: "Never presented as certainty",
            icon: Gauge,
          },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <article key={kpi.label} className="rounded-[22px] border border-line bg-surface p-5 shadow-[0_12px_35px_rgba(29,58,68,0.05)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-muted">{kpi.label}</p>
                  <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-ink">
                    {kpi.value}
                  </p>
                </div>
                <span className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand-strong">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
              </div>
              <p className="mt-4 text-xs leading-5 text-muted">{kpi.detail}</p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <article className="self-start rounded-[24px] border border-line bg-surface p-4 shadow-[0_18px_50px_rgba(29,58,68,0.06)] xl:sticky xl:top-24">
          <div className="p-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand">
              Response queue
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-ink">
              Incident cases
            </h2>
            <p className="mt-1 text-xs leading-5 text-muted">
              {isPortfolio ? "All authorised organisations" : "Selected tenant only"}
            </p>
          </div>

          <div className="mt-3 flex flex-wrap gap-2" aria-label="Incident filters">
            {filters.map((item) => (
              <button
                key={item.value}
                type="button"
                className={`rounded-full border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.08em] transition ${
                  effectiveFilter === item.value
                    ? "border-brand bg-brand text-white"
                    : "border-line bg-white text-muted hover:border-[#9bc9c0] hover:text-brand"
                }`}
                onClick={() => setFilter(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-2">
            {effectiveCases.map((incidentCase) => {
              const active = incidentCase.incident.id === selectedCase.incident.id;
              return (
                <button
                  key={incidentCase.incident.id}
                  type="button"
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    active
                      ? "border-[#91cfc2] bg-[#eff9f7] shadow-[0_10px_26px_rgba(11,128,111,0.08)]"
                      : "border-line bg-white hover:border-[#b8c9cc]"
                  }`}
                  onClick={() => setRequestedIncidentId(incidentCase.incident.id)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.1em] ${severityStyles[incidentCase.incident.severity]}`}>
                        {incidentCase.incident.severity}
                      </span>
                      {incidentCase.domains.map((domain) => (
                        <span key={domain} className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#405fa4]">
                          {domain}
                        </span>
                      ))}
                    </div>
                    <ChevronRight aria-hidden="true" className="size-4 text-muted" />
                  </div>
                  <p className="mt-3 text-sm font-semibold leading-5 text-ink">
                    {incidentCase.incident.title}
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-3 text-[10px] text-muted">
                    <span className="truncate">{incidentCase.organizationName}</span>
                    <span className={`shrink-0 rounded-full px-2 py-1 font-bold uppercase tracking-[0.08em] ${statusStyles[incidentCase.incident.status]}`}>
                      {formatValue(incidentCase.incident.status)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </article>

        <div className="min-w-0 space-y-5">
          <article className="overflow-hidden rounded-[24px] border border-line bg-surface shadow-[0_18px_50px_rgba(29,58,68,0.06)]">
            <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_250px]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${severityStyles[selectedCase.incident.severity]}`}>
                    {selectedCase.incident.severity} severity
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${statusStyles[selectedCase.incident.status]}`}>
                    {formatValue(selectedCase.incident.status)}
                  </span>
                  {selectedCase.domains.length === 2 ? (
                    <span className="rounded-full bg-[#edf0ff] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#405fa4]">
                      Cross-domain correlation
                    </span>
                  ) : null}
                </div>
                <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
                  {selectedCase.organizationName} · {selectedCase.incident.id}
                </p>
                <h2 className="mt-2 max-w-3xl text-2xl font-semibold leading-tight tracking-[-0.04em] text-ink sm:text-3xl">
                  {selectedCase.incident.title}
                </h2>
                <p className="mt-4 max-w-3xl text-sm leading-6 text-foreground">
                  {selectedCase.incident.businessImpact}
                </p>
              </div>
              <div className="rounded-2xl border border-line bg-[#f7fafb] p-4">
                <div className="flex items-center gap-2 text-muted">
                  <UsersRound aria-hidden="true" className="size-4" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em]">
                    Incident commander
                  </p>
                </div>
                <p className="mt-3 text-sm font-semibold text-ink">
                  {selectedCase.incident.commander}
                </p>
                <div className="mt-4 border-t border-line pt-4">
                  <p className="flex items-center gap-2 text-xs text-muted">
                    <Clock3 aria-hidden="true" className="size-4" />
                    Started {formatDateTime(selectedCase.incident.startedAt)}
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-xs text-muted">
                    <Building2 aria-hidden="true" className="size-4" />
                    {selectedCase.services.length} service
                    {selectedCase.services.length === 1 ? "" : "s"} ·{" "}
                    {selectedCase.assets.length} asset
                    {selectedCase.assets.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid border-t border-line sm:grid-cols-2">
              <button
                type="button"
                className={`flex items-center justify-center gap-2 px-5 py-4 text-sm font-semibold transition ${
                  mode === "TIMELINE"
                    ? "bg-[#eef8f6] text-brand-strong"
                    : "text-muted hover:bg-[#f7fafb] hover:text-ink"
                }`}
                onClick={() => setMode("TIMELINE")}
              >
                <FileText aria-hidden="true" className="size-4" /> Evidence timeline
              </button>
              <button
                type="button"
                className={`flex items-center justify-center gap-2 border-t border-line px-5 py-4 text-sm font-semibold transition sm:border-l sm:border-t-0 ${
                  mode === "ANALYSIS"
                    ? "bg-[#f0f2ff] text-[#405fa4]"
                    : "text-muted hover:bg-[#f7fafb] hover:text-ink"
                }`}
                onClick={() => setMode("ANALYSIS")}
              >
                <Sparkles aria-hidden="true" className="size-4" /> AI explanation
              </button>
            </div>
          </article>

          {mode === "TIMELINE" ? (
            <Timeline incidentCase={selectedCase} />
          ) : (
            <AiAnalysis incidentCase={selectedCase} />
          )}

          <section className="grid gap-5 lg:grid-cols-2">
            <article className="rounded-[24px] border border-line bg-surface p-5 shadow-[0_14px_40px_rgba(29,58,68,0.05)] sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand">
                    Runbook retrieval
                  </p>
                  <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-ink">
                    Recommended response
                  </h2>
                </div>
                <span className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand-strong">
                  <BookOpenCheck aria-hidden="true" className="size-5" />
                </span>
              </div>
              {runbook ? (
                <>
                  <div className="mt-5 rounded-2xl border border-line bg-[#f8fafb] p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#edf0ff] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-[#405fa4]">
                        {formatValue(runbook.action)}
                      </span>
                      <span className="rounded-full bg-[#fff4df] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-[#a66317]">
                        {runbook.risk} risk
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-ink">{runbook.name}</p>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      {runbook.description}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[#efdcb8] bg-[#fffaf1] p-4">
                    <LockKeyhole aria-hidden="true" className="size-5 shrink-0 text-[#a66317]" />
                    <div>
                      <p className="text-sm font-semibold text-ink">Approval required</p>
                      <p className="mt-1 text-xs leading-5 text-muted">
                        Open Automations to review the governed decision and
                        execution workflow.
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="mt-5 text-sm text-muted">No tenant runbook matches this case.</p>
              )}
            </article>

            <article className="rounded-[24px] border border-line bg-surface p-5 shadow-[0_14px_40px_rgba(29,58,68,0.05)] sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#405fa4]">
                    Communication draft
                  </p>
                  <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-ink">
                    Stakeholder update
                  </h2>
                </div>
                <span className="flex size-10 items-center justify-center rounded-xl bg-[#edf0ff] text-[#405fa4]">
                  <MessageSquareText aria-hidden="true" className="size-5" />
                </span>
              </div>
              <div className="mt-5 rounded-2xl border border-line bg-[#f8fafc] p-4">
                <p className="text-sm leading-6 text-foreground">
                  {selectedCase.stakeholderDraft}
                </p>
              </div>
              <div className="mt-4 flex items-start gap-3 text-xs leading-5 text-muted">
                <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand" />
                Draft only. An incident commander must review business wording before release.
              </div>
            </article>
          </section>

          <article className="rounded-[24px] border border-[#cce7e0] bg-[#ecf8f5] p-5 sm:p-6">
            <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <BadgeCheck aria-hidden="true" className="size-5 text-brand" />
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-strong">
                    Investigation contract
                  </p>
                </div>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-foreground">
                  This portfolio demonstration uses fixed, tenant-isolated evidence.
                  The AI output is reproducible, cites its sources, declares limitations,
                  and cannot execute the recommended runbook.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-brand-strong">
                {selectedCase.supportingEvidenceCount} supporting · {selectedCase.counterEvidenceCount} challenging
                <ArrowRight aria-hidden="true" className="size-4" />
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
