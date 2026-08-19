"use client";

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Boxes,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  CloudCog,
  Crosshair,
  Database,
  Eye,
  FileWarning,
  Fingerprint,
  Globe2,
  Laptop,
  LockKeyhole,
  Network,
  Radar,
  ScanSearch,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Siren,
  UserRoundSearch,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useWorkspace } from "@/components/workspace-provider";
import type {
  Asset,
  ExposureFinding,
  SecurityControl,
  SecurityDetection,
  Severity,
  Signal,
} from "@/domain/schemas";
import { summarizeSocWorkspace } from "@/domain/soc";

type DetectionSource = Extract<
  Signal["source"],
  "IDENTITY" | "ENDPOINT" | "CLOUD_POSTURE" | "NETWORK"
>;
type SourceFilter = "ALL" | DetectionSource;

type DetectionView = SecurityDetection & {
  signal: Signal;
  asset: Asset;
  organizationName: string;
  serviceName: string | null;
  incidentTitle: string | null;
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

const controlStyles: Record<SecurityControl["status"], string> = {
  EFFECTIVE: "bg-[#e7f7f2] text-[#087060]",
  PARTIAL: "bg-[#fff6e8] text-[#a66317]",
  GAP: "bg-[#fff0f0] text-[#b63f46]",
};

const findingStyles: Record<ExposureFinding["status"], string> = {
  OPEN: "bg-[#fff0f0] text-[#b63f46]",
  ACCEPTED: "bg-[#fff6e8] text-[#a66317]",
  REMEDIATED: "bg-[#e7f7f2] text-[#087060]",
};

const sourceLabels: Record<DetectionSource, string> = {
  IDENTITY: "Identity",
  ENDPOINT: "Endpoint",
  CLOUD_POSTURE: "Cloud",
  NETWORK: "Network",
};

const sourceIcons: Record<DetectionSource, typeof Fingerprint> = {
  IDENTITY: Fingerprint,
  ENDPOINT: Laptop,
  CLOUD_POSTURE: CloudCog,
  NETWORK: Network,
};

const chartTooltipStyle = {
  border: "1px solid #d8e3e6",
  borderRadius: 14,
  boxShadow: "0 16px 40px rgba(29, 58, 68, 0.12)",
  fontSize: 12,
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

function AssetSymbol({ asset }: { asset: Asset }) {
  if (asset.kind === "ENDPOINT") {
    return <Laptop aria-hidden="true" className="size-5 text-[#405fa4]" />;
  }
  if (asset.kind === "IDENTITY_PROVIDER") {
    return <Fingerprint aria-hidden="true" className="size-5 text-[#405fa4]" />;
  }
  if (asset.kind === "NETWORK_DEVICE") {
    return <Network aria-hidden="true" className="size-5 text-[#405fa4]" />;
  }
  if (asset.kind === "DATABASE") {
    return <Database aria-hidden="true" className="size-5 text-[#405fa4]" />;
  }
  return <Boxes aria-hidden="true" className="size-5 text-[#405fa4]" />;
}

export function SocWorkspace() {
  const { selection, visibleSnapshots } = useWorkspace();
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("ALL");
  const [requestedDetectionId, setRequestedDetectionId] = useState<string | null>(
    null,
  );

  const detections = useMemo<DetectionView[]>(() => {
    return visibleSnapshots
      .flatMap((snapshot) => {
        const signals = new Map(snapshot.signals.map((signal) => [signal.id, signal]));
        const assets = new Map(snapshot.assets.map((asset) => [asset.id, asset]));
        const services = new Map(
          snapshot.services.map((service) => [service.id, service.name]),
        );

        return snapshot.securityDetections.flatMap((detection) => {
          const signal = signals.get(detection.signalId);
          const asset = assets.get(detection.assetId);
          if (!signal || !asset) return [];

          const incident = snapshot.incidents.find((item) =>
            item.signalIds.includes(signal.id),
          );

          return [
            {
              ...detection,
              signal,
              asset,
              organizationName: snapshot.organization.shortName,
              serviceName: signal.serviceId
                ? (services.get(signal.serviceId) ?? null)
                : null,
              incidentTitle: incident?.title ?? null,
            },
          ];
        });
      })
      .sort((left, right) => {
        const activeDifference =
          Number(left.signal.status === "RESOLVED") -
          Number(right.signal.status === "RESOLVED");
        if (activeDifference !== 0) return activeDifference;

        const severityDifference =
          severityWeight[right.signal.severity] - severityWeight[left.signal.severity];
        if (severityDifference !== 0) return severityDifference;
        return right.lastSeenAt.localeCompare(left.lastSeenAt);
      });
  }, [visibleSnapshots]);

  const effectiveSourceFilter =
    sourceFilter !== "ALL" &&
    detections.some((detection) => detection.signal.source === sourceFilter)
      ? sourceFilter
      : "ALL";
  const filteredDetections = detections.filter(
    (detection) =>
      effectiveSourceFilter === "ALL" ||
      detection.signal.source === effectiveSourceFilter,
  );
  const monitoredSourceCount = new Set(
    detections.map((detection) => detection.signal.source),
  ).size;
  const selectedDetection =
    filteredDetections.find((detection) => detection.id === requestedDetectionId) ??
    filteredDetections[0] ??
    detections[0];

  const portfolio = useMemo(() => {
    const summaries = visibleSnapshots.map(summarizeSocWorkspace);
    const allControls = visibleSnapshots.flatMap(
      (snapshot) => snapshot.securityControls,
    );
    const allAssets = visibleSnapshots.flatMap((snapshot) => snapshot.assets);
    const effectiveControls = allControls.filter(
      (control) => control.status === "EFFECTIVE",
    ).length;

    return {
      activeDetections: summaries.reduce(
        (total, summary) => total + summary.activeDetections,
        0,
      ),
      highPriorityDetections: summaries.reduce(
        (total, summary) => total + summary.highPriorityDetections,
        0,
      ),
      untriagedDetections: summaries.reduce(
        (total, summary) => total + summary.untriagedDetections,
        0,
      ),
      openFindings: summaries.reduce(
        (total, summary) => total + summary.openFindings,
        0,
      ),
      highRiskAssets: summaries.reduce(
        (total, summary) => total + summary.highRiskAssets,
        0,
      ),
      monitoredAssets: allAssets.length,
      controlCoverage:
        allControls.length === 0
          ? 100
          : Math.round(
              allControls.reduce(
                (total, control) => total + control.coveragePercent,
                0,
              ) / allControls.length,
            ),
      effectiveControls:
        allControls.length === 0
          ? 100
          : Math.round((effectiveControls / allControls.length) * 100),
    };
  }, [visibleSnapshots]);

  const sourceDistribution = (
    Object.keys(sourceLabels) as DetectionSource[]
  ).map((source) => ({
    source: sourceLabels[source],
    active: detections.filter(
      (detection) =>
        detection.signal.source === source && detection.signal.status !== "RESOLVED",
    ).length,
    resolved: detections.filter(
      (detection) =>
        detection.signal.source === source && detection.signal.status === "RESOLVED",
    ).length,
  }));

  const findings = visibleSnapshots
    .flatMap((snapshot) =>
      snapshot.exposureFindings.map((finding) => ({
        ...finding,
        organizationName: snapshot.organization.shortName,
        asset: snapshot.assets.find((asset) => asset.id === finding.assetId),
      })),
    )
    .sort(
      (left, right) =>
        severityWeight[right.severity] - severityWeight[left.severity],
    );
  const controls = visibleSnapshots.flatMap((snapshot) =>
    snapshot.securityControls.map((control) => ({
      ...control,
      organizationName: snapshot.organization.shortName,
    })),
  );

  if (!selectedDetection) return null;

  const SelectedSourceIcon =
    sourceIcons[selectedDetection.signal.source as DetectionSource] ?? ShieldAlert;
  const selectedIncident = visibleSnapshots
    .flatMap((snapshot) => snapshot.incidents)
    .find((incident) => incident.signalIds.includes(selectedDetection.signal.id));

  const kpis = [
    {
      label: "Active detections",
      value: portfolio.activeDetections,
      helper: `${portfolio.untriagedDetections} awaiting first review`,
      icon: Radar,
      tone: "bg-[#e7edff] text-[#405fa4]",
    },
    {
      label: "High priority",
      value: portfolio.highPriorityDetections,
      helper: "High or critical active signals",
      icon: Siren,
      tone: "bg-[#ffe8e8] text-[#b63f46]",
    },
    {
      label: "Exposure findings",
      value: portfolio.openFindings,
      helper: `${portfolio.highRiskAssets} high-risk assets`,
      icon: Globe2,
      tone: "bg-[#fff4df] text-[#a66317]",
    },
    {
      label: "Control coverage",
      value: `${portfolio.controlCoverage}%`,
      helper: `${portfolio.effectiveControls}% fully effective`,
      icon: ShieldCheck,
      tone: "bg-[#e2f7f1] text-[#087060]",
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="relative overflow-hidden rounded-[30px] bg-[#101726] px-6 py-8 text-white shadow-[0_24px_70px_rgba(7,25,35,0.22)] sm:px-8 sm:py-10 lg:px-10">
        <div className="absolute -right-20 -top-28 size-72 rounded-full border-[48px] border-[#34446e]/35" />
        <div className="absolute bottom-0 right-[28%] h-32 w-px bg-gradient-to-b from-transparent to-[#7189cf]/30" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_310px] lg:items-end">
          <div>
            <div className="flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#aab4cc]">
              <span className="signal-dot size-1.5 rounded-full bg-[#8da7f2]" />
              SOC fusion desk · simulated detections
            </div>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-[#9cb2f1]">
              Cyber monitoring
            </p>
            <h1 className="mt-3 max-w-4xl text-4xl font-semibold leading-[1.03] tracking-[-0.055em] sm:text-5xl lg:text-6xl">
              See the attack path,
              <span className="block text-[#9cb2f1]">not another alert queue.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#aab4cc] sm:text-lg">
              Identity, endpoint, cloud, and network signals become one evidence-backed,
              tenant-isolated analyst view.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#71809e]">
                  Monitoring status
                </p>
                <p className="mt-2 text-lg font-semibold">Fusion online</p>
              </div>
              <span className="flex size-11 items-center justify-center rounded-xl bg-[#9cb2f1]/10 text-[#9cb2f1]">
                <ScanSearch aria-hidden="true" className="size-6" />
              </span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.12em] text-[#71809e]">
                  Assets
                </p>
                <p className="mt-1 text-xl font-semibold">{portfolio.monitoredAssets}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.12em] text-[#71809e]">
                  Sources
                </p>
                <p className="mt-1 text-xl font-semibold">
                  {monitoredSourceCount}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="SOC KPIs">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <article
              key={kpi.label}
              className="rounded-[22px] border border-line bg-surface p-5 shadow-[0_12px_35px_rgba(29,58,68,0.055)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted">{kpi.label}</p>
                  <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-ink">
                    {kpi.value}
                  </p>
                </div>
                <span className={`flex size-10 items-center justify-center rounded-xl ${kpi.tone}`}>
                  <Icon aria-hidden="true" className="size-5" />
                </span>
              </div>
              <p className="mt-4 text-xs leading-5 text-muted">{kpi.helper}</p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.82fr_1.18fr]">
        <article className="rounded-[24px] border border-line bg-surface p-5 shadow-[0_12px_35px_rgba(29,58,68,0.05)] sm:p-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#405fa4]">
              Analyst queue
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-ink">
              Correlated detections
            </h2>
          </div>

          <div className="mt-5 flex flex-wrap gap-2" aria-label="Detection source filters">
            {(["ALL", ...Object.keys(sourceLabels)] as SourceFilter[]).map((source) => (
              <button
                key={source}
                type="button"
                className={`rounded-full border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.1em] transition ${effectiveSourceFilter === source ? "border-[#405fa4] bg-[#405fa4] text-white" : "border-line bg-white text-muted hover:border-[#9aaedc] hover:text-[#405fa4]"}`}
                onClick={() => setSourceFilter(source)}
              >
                {source === "ALL" ? "All sources" : sourceLabels[source]}
              </button>
            ))}
          </div>

          <div className="mt-5 space-y-3">
            {filteredDetections.map((detection) => {
              const Icon =
                sourceIcons[detection.signal.source as DetectionSource] ?? ShieldAlert;
              const isSelected = detection.id === selectedDetection.id;

              return (
                <button
                  key={detection.id}
                  type="button"
                  className={`w-full rounded-2xl border p-4 text-left transition ${isSelected ? "border-[#849be0] bg-[#f1f4ff] shadow-[0_10px_28px_rgba(64,95,164,0.1)]" : "border-line bg-[#fafcfc] hover:border-[#b9c7e8]"}`}
                  onClick={() => setRequestedDetectionId(detection.id)}
                >
                  <div className="flex items-start gap-3">
                    <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${isSelected ? "bg-[#405fa4] text-white" : "bg-[#e7edff] text-[#405fa4]"}`}>
                      <Icon aria-hidden="true" className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${severityStyles[detection.signal.severity]}`}>
                          {detection.signal.severity}
                        </span>
                        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
                          {sourceLabels[detection.signal.source as DetectionSource]}
                        </span>
                        <span className="ml-auto text-[10px] text-muted">
                          {formatDateTime(detection.lastSeenAt)}
                        </span>
                      </div>
                      <p className="mt-3 text-sm font-semibold leading-5 text-ink">
                        {detection.signal.title}
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-muted">
                        <span className="truncate">
                          {selection === "portfolio" ? `${detection.organizationName} · ` : ""}
                          {detection.entity}
                        </span>
                        <ChevronRight aria-hidden="true" className="size-4 shrink-0" />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
            {filteredDetections.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">
                No detections from this source are visible in the active workspace.
              </div>
            ) : null}
          </div>
        </article>

        <article className="overflow-hidden rounded-[24px] border border-line bg-surface shadow-[0_12px_35px_rgba(29,58,68,0.05)]">
          <div className="border-b border-line bg-[#101726] p-6 text-white sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#9cb2f1]/10 text-[#9cb2f1]">
                  <SelectedSourceIcon aria-hidden="true" className="size-6" />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8292b2]">
                    Detection investigation
                  </p>
                  <h2 className="mt-2 max-w-xl text-2xl font-semibold tracking-[-0.04em]">
                    {selectedDetection.signal.title}
                  </h2>
                </div>
              </div>
              <span className={`rounded-full px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.12em] ${severityStyles[selectedDetection.signal.severity]}`}>
                {selectedDetection.signal.severity} severity
              </span>
            </div>
            <p className="mt-5 max-w-3xl text-sm leading-6 text-[#aab4cc]">
              {selectedDetection.signal.summary}
            </p>
          </div>

          <div className="space-y-6 p-5 sm:p-7">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-[#f5f7fb] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
                  Confidence
                </p>
                <p className="mt-2 text-2xl font-semibold text-ink">
                  {selectedDetection.confidence}%
                </p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#dfe5f3]">
                  <div
                    className="h-full rounded-full bg-[#405fa4]"
                    style={{ width: `${selectedDetection.confidence}%` }}
                  />
                </div>
              </div>
              <div className="rounded-2xl bg-[#f5f7fb] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
                  Events
                </p>
                <p className="mt-2 text-2xl font-semibold text-ink">
                  {selectedDetection.eventCount.toLocaleString()}
                </p>
                <p className="mt-3 text-[10px] text-muted">Correlated observations</p>
              </div>
              <div className="rounded-2xl bg-[#f5f7fb] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
                  Triage state
                </p>
                <p className="mt-2 text-sm font-semibold capitalize leading-6 text-ink">
                  {formatValue(selectedDetection.disposition)}
                </p>
                <p className="mt-2 text-[10px] text-muted">
                  Signal {formatValue(selectedDetection.signal.status)}
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#405fa4]">
                    Attack path
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-ink">
                    Evidence progression
                  </h3>
                </div>
                <span className="rounded-full bg-[#e7edff] px-3 py-1 text-[9px] font-bold tracking-[0.1em] text-[#405fa4]">
                  {selectedDetection.techniqueId}
                </span>
              </div>
              <div className="mt-4 grid items-stretch gap-2 sm:grid-cols-[1fr_auto_1fr_auto_1fr]">
                <div className="rounded-2xl border border-line p-4">
                  <UserRoundSearch aria-hidden="true" className="size-5 text-[#405fa4]" />
                  <p className="mt-3 text-[10px] uppercase tracking-[0.12em] text-muted">
                    Observed entity
                  </p>
                  <p className="mt-1 break-words text-sm font-semibold text-ink">
                    {selectedDetection.entity}
                  </p>
                  <p className="mt-2 text-[11px] text-muted">
                    {selectedDetection.sourceLocation}
                  </p>
                </div>
                <ArrowRight aria-hidden="true" className="mx-auto size-4 self-center rotate-90 text-[#8fa0aa] sm:rotate-0" />
                <div className="rounded-2xl border border-line p-4">
                  <AssetSymbol asset={selectedDetection.asset} />
                  <p className="mt-3 text-[10px] uppercase tracking-[0.12em] text-muted">
                    Affected asset
                  </p>
                  <p className="mt-1 text-sm font-semibold text-ink">
                    {selectedDetection.asset.name}
                  </p>
                  <p className="mt-2 text-[11px] text-muted">
                    Risk {selectedDetection.asset.riskScore}/100 · {formatValue(selectedDetection.asset.exposure)}
                  </p>
                </div>
                <ArrowRight aria-hidden="true" className="mx-auto size-4 self-center rotate-90 text-[#8fa0aa] sm:rotate-0" />
                <div className={`rounded-2xl border p-4 ${selectedIncident ? "border-[#f0cfd1] bg-[#fff7f7]" : "border-[#cbe7df] bg-[#f2faf7]"}`}>
                  {selectedIncident ? <Siren aria-hidden="true" className="size-5 text-danger" /> : <ShieldCheck aria-hidden="true" className="size-5 text-brand" />}
                  <p className="mt-3 text-[10px] uppercase tracking-[0.12em] text-muted">
                    Operational outcome
                  </p>
                  <p className="mt-1 text-sm font-semibold text-ink">
                    {selectedDetection.incidentTitle ?? "Preventive control held"}
                  </p>
                  <p className="mt-2 text-[11px] leading-5 text-muted">
                    {selectedDetection.serviceName ?? "No production service impact"}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-line p-4">
                <div className="flex items-center gap-2">
                  <Crosshair aria-hidden="true" className="size-4 text-[#405fa4]" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
                    MITRE-aligned context
                  </p>
                </div>
                <p className="mt-3 text-sm font-semibold text-ink">
                  {formatValue(selectedDetection.tactic)}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {selectedDetection.techniqueId} · {selectedDetection.technique}
                </p>
              </div>
              <div className="rounded-2xl border border-line p-4">
                <div className="flex items-center gap-2">
                  <Activity aria-hidden="true" className="size-4 text-[#405fa4]" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
                    Observation window
                  </p>
                </div>
                <p className="mt-3 text-sm font-semibold text-ink">
                  {formatDateTime(selectedDetection.firstSeenAt)} SGT
                </p>
                <p className="mt-1 text-sm text-muted">
                  Last activity {formatDateTime(selectedDetection.lastSeenAt)} SGT
                </p>
              </div>
            </div>

            {selectedIncident ? (
              <div className="rounded-2xl border border-[#f0cfd1] bg-[#fff5f5] p-5">
                <div className="flex items-start gap-3">
                  <AlertTriangle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-danger" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-danger">
                      Correlated business impact
                    </p>
                    <p className="mt-2 text-sm font-semibold text-ink">
                      {selectedIncident.title}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      {selectedIncident.businessImpact}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.75fr_1.25fr]">
        <article className="rounded-[24px] border border-line bg-surface p-5 shadow-[0_12px_35px_rgba(29,58,68,0.05)] sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#405fa4]">
                Telemetry fusion
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.035em] text-ink">
                Detection sources
              </h2>
            </div>
            <Eye aria-hidden="true" className="size-5 text-[#405fa4]" />
          </div>
          <div className="mt-6 h-64 w-full" aria-label="Detection source chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sourceDistribution} layout="vertical" margin={{ top: 0, right: 5, bottom: 0, left: 2 }}>
                <CartesianGrid stroke="#e5edef" strokeDasharray="4 4" horizontal={false} />
                <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#617681", fontSize: 10 }} />
                <YAxis type="category" dataKey="source" width={62} axisLine={false} tickLine={false} tick={{ fill: "#617681", fontSize: 10 }} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="active" name="Active" stackId="detections" fill="#405fa4" radius={[4, 0, 0, 4]} />
                <Bar dataKey="resolved" name="Resolved" stackId="detections" fill="#9edccc" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex gap-4 text-[11px] font-semibold text-muted">
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#405fa4]" />Active</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#9edccc]" />Resolved</span>
          </div>
        </article>

        <article className="rounded-[24px] border border-line bg-surface p-5 shadow-[0_12px_35px_rgba(29,58,68,0.05)] sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#405fa4]">
                Attack surface
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.035em] text-ink">
                Exposure findings
              </h2>
            </div>
            <span className="rounded-full bg-[#fff4df] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#a66317]">
              {portfolio.openFindings} open
            </span>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {findings.slice(0, 6).map((finding) => (
              <div key={finding.id} className="rounded-2xl border border-line bg-[#fafcfc] p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${severityStyles[finding.severity]}`}>
                    {finding.severity}
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${findingStyles[finding.status]}`}>
                    {formatValue(finding.status)}
                  </span>
                </div>
                <p className="mt-3 text-sm font-semibold leading-5 text-ink">{finding.title}</p>
                <p className="mt-2 text-xs text-muted">
                  {selection === "portfolio" ? `${finding.organizationName} · ` : ""}
                  {finding.asset?.name ?? "Unknown asset"}
                </p>
                <p className="mt-3 text-[10px] uppercase tracking-[0.1em] text-[#405fa4]">
                  {formatValue(finding.category)} · {finding.controlReferences[0]}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="rounded-[24px] border border-line bg-surface p-5 shadow-[0_12px_35px_rgba(29,58,68,0.05)] sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#405fa4]">
              Preventive posture
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-[-0.035em] text-ink">
              Security control coverage
            </h2>
          </div>
          <p className="text-xs text-muted">Coverage is deterministic portfolio demonstration data</p>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {controls.map((control) => (
            <div key={control.id} className="rounded-2xl border border-line p-4">
              <div className="flex items-start justify-between gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-[#e7edff] text-[#405fa4]">
                  {control.category === "IDENTITY" ? <LockKeyhole aria-hidden="true" className="size-5" /> : control.category === "ENDPOINT" ? <Laptop aria-hidden="true" className="size-5" /> : control.category === "NETWORK" ? <Network aria-hidden="true" className="size-5" /> : control.category === "DATA_PROTECTION" ? <Database aria-hidden="true" className="size-5" /> : <CloudCog aria-hidden="true" className="size-5" />}
                </span>
                <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${controlStyles[control.status]}`}>
                  {formatValue(control.status)}
                </span>
              </div>
              <p className="mt-4 text-sm font-semibold text-ink">{control.name}</p>
              <p className="mt-1 text-[11px] text-muted">
                {selection === "portfolio" ? `${control.organizationName} · ` : ""}
                {control.monitoredAssets} assets monitored
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#e8edf3]">
                  <div className="h-full rounded-full bg-[#405fa4]" style={{ width: `${control.coveragePercent}%` }} />
                </div>
                <span className="text-sm font-semibold text-ink">{control.coveragePercent}%</span>
              </div>
              <p className="mt-3 text-xs leading-5 text-muted">{control.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 rounded-[24px] border border-[#cad5f0] bg-[#f0f3fb] p-5 sm:grid-cols-2 lg:grid-cols-4 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-white text-[#405fa4]"><Shield aria-hidden="true" className="size-5" /></span>
          <div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#405fa4]">Tenant boundary</p><p className="mt-1 text-sm font-semibold text-ink">Enforced</p></div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-white text-[#405fa4]"><BadgeCheck aria-hidden="true" className="size-5" /></span>
          <div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#405fa4]">Analyst evidence</p><p className="mt-1 text-sm font-semibold text-ink">Explainable</p></div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-white text-[#405fa4]"><CheckCircle2 aria-hidden="true" className="size-5" /></span>
          <div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#405fa4]">Automation</p><p className="mt-1 text-sm font-semibold text-ink">Approval required</p></div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-white text-[#405fa4]"><CircleDot aria-hidden="true" className="size-5" /></span>
          <div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#405fa4]">Data mode</p><p className="mt-1 text-sm font-semibold text-ink">Simulated only</p></div>
        </div>
      </section>

      <p className="flex items-center justify-center gap-2 text-center text-[11px] leading-5 text-muted">
        <FileWarning aria-hidden="true" className="size-4" />
        No live identities, endpoints, patient records, customer records, or cloud accounts are connected.
      </p>
    </div>
  );
}
