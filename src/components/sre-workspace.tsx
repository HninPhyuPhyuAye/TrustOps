"use client";

import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  CircleGauge,
  Clock3,
  CloudCog,
  Code2,
  DatabaseBackup,
  Gauge,
  GitCommitHorizontal,
  HeartPulse,
  RadioTower,
  RefreshCw,
  ServerCog,
  ShieldCheck,
  TimerReset,
  Waypoints,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useWorkspace } from "@/components/workspace-provider";
import { calculateErrorBudgetBurn, summarizeSreWorkspace } from "@/domain/sre";
import type {
  Deployment,
  HealthStatus,
  RecoveryCheck,
  TelemetryEvent,
} from "@/domain/schemas";

const statusStyles: Record<HealthStatus, string> = {
  HEALTHY: "border-[#cbe7df] bg-[#e7f7f2] text-[#087060]",
  DEGRADED: "border-[#f0dcc1] bg-[#fff6e8] text-[#a66317]",
  CRITICAL: "border-[#f0cfd1] bg-[#fff0f0] text-[#b63f46]",
  UNKNOWN: "border-line bg-[#f2f5f6] text-muted",
};

const recoveryStyles: Record<RecoveryCheck["status"], string> = {
  PASS: "bg-[#e7f7f2] text-[#087060]",
  WARN: "bg-[#fff6e8] text-[#a66317]",
  FAIL: "bg-[#fff0f0] text-[#b63f46]",
};

const telemetryStyles: Record<TelemetryEvent["level"], string> = {
  DEBUG: "bg-[#edf3f5] text-muted",
  INFO: "bg-[#e7f7f2] text-[#087060]",
  WARN: "bg-[#fff6e8] text-[#a66317]",
  ERROR: "bg-[#fff0f0] text-[#b63f46]",
};

const deploymentStyles: Record<Deployment["status"], string> = {
  SUCCEEDED: "bg-[#e7f7f2] text-[#087060]",
  FAILED: "bg-[#fff0f0] text-[#b63f46]",
  ROLLED_BACK: "bg-[#fff6e8] text-[#a66317]",
};

const chartTooltipStyle = {
  border: "1px solid #d8e3e6",
  borderRadius: 14,
  boxShadow: "0 16px 40px rgba(29, 58, 68, 0.12)",
  fontSize: 12,
};

function formatStatus(value: string) {
  return value.toLowerCase().replaceAll("_", " ");
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-SG", {
    timeZone: "Asia/Singapore",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
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

function burnTone(burn: number) {
  if (burn >= 2) return "text-[#b63f46]";
  if (burn >= 1) return "text-[#a66317]";
  return "text-[#087060]";
}

export function SreWorkspace() {
  const { selection, visibleSnapshots } = useWorkspace();
  const [requestedServiceId, setRequestedServiceId] = useState<string | null>(null);

  const services = useMemo(
    () =>
      visibleSnapshots
        .flatMap((snapshot) =>
          snapshot.services.map((service) => ({
            ...service,
            organizationName: snapshot.organization.shortName,
          })),
        )
        .sort(
          (left, right) =>
            calculateErrorBudgetBurn(right) - calculateErrorBudgetBurn(left),
        ),
    [visibleSnapshots],
  );

  const selectedService =
    services.find((service) => service.id === requestedServiceId) ?? services[0];
  const selectedSnapshot = visibleSnapshots.find(
    (snapshot) => snapshot.organization.id === selectedService?.organizationId,
  );

  const metricPoints = useMemo(
    () =>
      (selectedSnapshot?.serviceMetricPoints ?? [])
        .filter((point) => point.serviceId === selectedService?.id)
        .sort((left, right) => left.observedAt.localeCompare(right.observedAt))
        .map((point) => ({
          ...point,
          time: formatTime(point.observedAt),
        })),
    [selectedService?.id, selectedSnapshot?.serviceMetricPoints],
  );

  const portfolioSummary = useMemo(() => {
    const summaries = visibleSnapshots.map(summarizeSreWorkspace);
    const serviceCount = summaries.reduce((total, summary) => total + summary.serviceCount, 0);
    const recoveryChecks = visibleSnapshots.flatMap((snapshot) => snapshot.recoveryChecks);
    const passingChecks = recoveryChecks.filter((check) => check.status === "PASS").length;

    return {
      serviceCount,
      servicesAtRisk: summaries.reduce(
        (total, summary) => total + summary.servicesAtRisk,
        0,
      ),
      availability:
        serviceCount === 0
          ? 100
          : visibleSnapshots
              .flatMap((snapshot) => snapshot.services)
              .reduce((total, service) => total + service.currentAvailability, 0) /
            serviceCount,
      traffic: summaries.reduce(
        (total, summary) => total + summary.trafficPerMinute,
        0,
      ),
      recoveryReadiness:
        recoveryChecks.length === 0
          ? 100
          : Math.round((passingChecks / recoveryChecks.length) * 100),
      maximumBurnRate: Math.max(
        0,
        ...summaries.map((summary) => summary.maximumBurnRate),
      ),
    };
  }, [visibleSnapshots]);

  if (!selectedService || !selectedSnapshot) {
    return null;
  }

  const latestPoint = metricPoints.at(-1);
  const burnRate = calculateErrorBudgetBurn(selectedService);
  const errorBudgetRemaining = Math.max(
    0,
    Math.round((1 - Math.min(burnRate, 1)) * 100),
  );
  const deployments = selectedSnapshot.deployments
    .filter((deployment) => deployment.serviceId === selectedService.id)
    .sort((left, right) => right.deployedAt.localeCompare(left.deployedAt));
  const telemetry = selectedSnapshot.telemetryEvents
    .filter((event) => event.serviceId === selectedService.id)
    .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt));
  const recoveryChecks = selectedSnapshot.recoveryChecks.filter(
    (check) => check.serviceId === selectedService.id,
  );
  const activeIncident = selectedSnapshot.incidents.find(
    (incident) =>
      incident.status !== "RESOLVED" && incident.serviceIds.includes(selectedService.id),
  );
  const infrastructure = selectedSnapshot.infrastructureResources;

  const goldenSignals = [
    {
      label: "Availability",
      value: `${selectedService.currentAvailability.toFixed(3)}%`,
      helper: `${selectedService.availabilityTarget}% objective`,
      trend: selectedService.currentAvailability >= selectedService.availabilityTarget,
      icon: HeartPulse,
    },
    {
      label: "P95 latency",
      value: `${selectedService.latencyP95Ms.toLocaleString()} ms`,
      helper: latestPoint ? `${latestPoint.latencyP95Ms} ms latest` : "No current sample",
      trend: selectedService.latencyP95Ms < 500,
      icon: Clock3,
    },
    {
      label: "Traffic",
      value: `${(latestPoint?.trafficPerMinute ?? 0).toLocaleString()}/min`,
      helper: "Production requests",
      trend: true,
      icon: RadioTower,
    },
    {
      label: "Errors",
      value: `${selectedService.errorRatePercent.toFixed(2)}%`,
      helper: "Across sampled requests",
      trend: selectedService.errorRatePercent < 1,
      icon: AlertTriangle,
    },
    {
      label: "Saturation",
      value: `${selectedService.saturationPercent.toFixed(0)}%`,
      helper: `${Math.max(0, 100 - selectedService.saturationPercent).toFixed(0)}% headroom`,
      trend: selectedService.saturationPercent < 70,
      icon: Gauge,
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="relative overflow-hidden rounded-[30px] bg-ink px-6 py-8 text-white shadow-[0_24px_70px_rgba(7,25,35,0.2)] sm:px-8 sm:py-10 lg:px-10">
        <div className="absolute -right-24 -top-32 size-80 rounded-full border-[54px] border-[#0d806f]/30" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#a5b8c0]">
              <span className="signal-dot size-1.5 rounded-full bg-[#55ddc2]" />
              SRE control room · simulated telemetry
            </div>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-[#65ddc6]">
              Reliability engineering
            </p>
            <h1 className="mt-3 max-w-4xl text-4xl font-semibold leading-[1.03] tracking-[-0.055em] sm:text-5xl lg:text-6xl">
              Health you can explain,
              <span className="block text-[#65ddc6]">before customers have to.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#a5b8c0] sm:text-lg">
              Golden signals, SLO burn, changes, telemetry, and recovery evidence in one
              tenant-aware operating view.
            </p>
          </div>

          <div className="min-w-64 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <label
              className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#78939e]"
              htmlFor="service-focus"
            >
              Service focus
            </label>
            <select
              id="service-focus"
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#102d38] px-3 py-3 text-sm font-semibold text-white outline-none focus:border-[#65ddc6]"
              value={selectedService.id}
              onChange={(event) => setRequestedServiceId(event.target.value)}
            >
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {selection === "portfolio" ? `${service.organizationName} · ` : ""}
                  {service.name}
                </option>
              ))}
            </select>
            <div className="mt-3 flex items-center justify-between text-xs text-[#a5b8c0]">
              <span>{selectedService.owningTeam}</span>
              <span className="font-semibold text-[#65ddc6]">
                {formatStatus(selectedService.criticality)}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5" aria-label="Golden signals">
        {goldenSignals.map((signal) => {
          const Icon = signal.icon;
          const TrendIcon = signal.trend ? ArrowUpRight : ArrowDownRight;

          return (
            <article
              key={signal.label}
              className="rounded-[22px] border border-line bg-surface p-5 shadow-[0_12px_35px_rgba(29,58,68,0.055)]"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand-strong">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <TrendIcon
                  aria-hidden="true"
                  className={`size-4 ${signal.trend ? "text-brand" : "text-danger"}`}
                />
              </div>
              <p className="mt-5 text-xs font-medium text-muted">{signal.label}</p>
              <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-ink">
                {signal.value}
              </p>
              <p className="mt-2 text-[11px] leading-5 text-muted">{signal.helper}</p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.45fr_0.55fr]">
        <article className="rounded-[24px] border border-line bg-surface p-5 shadow-[0_12px_35px_rgba(29,58,68,0.05)] sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand">
                Service telemetry
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-ink">
                Latency and error pressure
              </h2>
              <p className="mt-2 text-sm text-muted">
                15-minute samples · Singapore time · fixed demonstration data
              </p>
            </div>
            <div className="flex gap-3 text-[11px] font-semibold text-muted">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-brand" /> Latency
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#d27b45]" /> Errors
              </span>
            </div>
          </div>
          <div className="mt-6 h-72 w-full" aria-label="Latency and error rate chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metricPoints} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid stroke="#e5edef" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: "#617681", fontSize: 11 }} />
                <YAxis yAxisId="latency" axisLine={false} tickLine={false} tick={{ fill: "#617681", fontSize: 11 }} />
                <YAxis yAxisId="errors" orientation="right" axisLine={false} tickLine={false} tick={{ fill: "#617681", fontSize: 11 }} />
                <Tooltip contentStyle={chartTooltipStyle} labelStyle={{ color: "#10232d", fontWeight: 700 }} />
                <ReferenceLine yAxisId="latency" y={500} stroke="#c84f55" strokeDasharray="5 5" />
                <Line yAxisId="latency" type="monotone" dataKey="latencyP95Ms" name="P95 latency (ms)" stroke="#0b806f" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
                <Line yAxisId="errors" type="monotone" dataKey="errorRatePercent" name="Errors (%)" stroke="#d27b45" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="overflow-hidden rounded-[24px] border border-line bg-surface shadow-[0_12px_35px_rgba(29,58,68,0.05)]">
          <div className="bg-[#102d38] p-6 text-white">
            <div className="flex items-center justify-between gap-3">
              <span className="flex size-11 items-center justify-center rounded-xl bg-white/10 text-[#65ddc6]">
                <CircleGauge aria-hidden="true" className="size-6" />
              </span>
              <span className={`text-3xl font-semibold ${burnRate >= 2 ? "text-[#ffaaa9]" : "text-[#65ddc6]"}`}>
                {burnRate.toFixed(1)}×
              </span>
            </div>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-[#78939e]">
              Error-budget burn
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
              {burnRate >= 2 ? "SLO needs attention" : "Within operating budget"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#a5b8c0]">
              {selectedService.currentAvailability.toFixed(3)}% observed against a {selectedService.availabilityTarget}% objective.
            </p>
          </div>
          <div className="p-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs text-muted">Budget remaining</p>
                <p className={`mt-1 text-3xl font-semibold ${burnTone(burnRate)}`}>
                  {errorBudgetRemaining}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted">Portfolio max</p>
                <p className="mt-1 text-lg font-semibold text-ink">
                  {portfolioSummary.maximumBurnRate.toFixed(1)}×
                </p>
              </div>
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#e8eff1]">
              <div
                className={`h-full rounded-full ${burnRate >= 1 ? "bg-danger" : "bg-brand"}`}
                style={{ width: `${errorBudgetRemaining}%` }}
              />
            </div>
            <p className="mt-5 text-xs leading-5 text-muted">
              Burn compares observed unavailability with the service objective. It is an explanatory demo indicator, not a production paging policy.
            </p>
          </div>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.65fr_1.35fr]">
        <article className="rounded-[24px] border border-line bg-surface p-5 shadow-[0_12px_35px_rgba(29,58,68,0.05)] sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand">
                Capacity
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.035em] text-ink">
                Traffic and saturation
              </h2>
            </div>
            <Waypoints aria-hidden="true" className="size-5 text-brand" />
          </div>
          <div className="mt-6 h-56 w-full" aria-label="Traffic and saturation chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metricPoints} margin={{ top: 8, right: 4, bottom: 0, left: -26 }}>
                <defs>
                  <linearGradient id="traffic-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0b806f" stopOpacity={0.32} />
                    <stop offset="95%" stopColor="#0b806f" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e5edef" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: "#617681", fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#617681", fontSize: 10 }} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Area type="monotone" dataKey="trafficPerMinute" name="Requests / min" stroke="#0b806f" strokeWidth={2.5} fill="url(#traffic-fill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[#f5f8f9] p-3">
              <p className="text-[10px] uppercase tracking-[0.12em] text-muted">Latest load</p>
              <p className="mt-1 font-semibold text-ink">{(latestPoint?.trafficPerMinute ?? 0).toLocaleString()}/min</p>
            </div>
            <div className="rounded-xl bg-[#f5f8f9] p-3">
              <p className="text-[10px] uppercase tracking-[0.12em] text-muted">Headroom</p>
              <p className="mt-1 font-semibold text-ink">{Math.max(0, 100 - selectedService.saturationPercent).toFixed(0)}%</p>
            </div>
          </div>
        </article>

        <article className="rounded-[24px] border border-line bg-surface p-5 shadow-[0_12px_35px_rgba(29,58,68,0.05)] sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand">
                Business context
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.035em] text-ink">
                From signal to consequence
              </h2>
            </div>
            <span className={`rounded-full border px-3 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${statusStyles[selectedService.healthStatus]}`}>
              {formatStatus(selectedService.healthStatus)}
            </span>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-[0.7fr_1.3fr]">
            <div className="rounded-2xl border border-line bg-[#f7fafb] p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">Business process</p>
              <p className="mt-3 text-lg font-semibold text-ink">{selectedService.businessProcess}</p>
              <p className="mt-3 text-sm leading-6 text-muted">Owned by {selectedService.owningTeam} in the {formatStatus(selectedService.environment)} environment.</p>
            </div>
            <div className={`rounded-2xl border p-5 ${activeIncident ? "border-[#f0cfd1] bg-[#fff5f5]" : "border-[#cbe7df] bg-[#eff9f6]"}`}>
              <div className="flex items-center gap-2">
                {activeIncident ? <AlertTriangle aria-hidden="true" className="size-5 text-danger" /> : <ShieldCheck aria-hidden="true" className="size-5 text-brand" />}
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
                  {activeIncident ? "Active incident impact" : "No active service impact"}
                </p>
              </div>
              <p className="mt-3 text-lg font-semibold text-ink">
                {activeIncident?.title ?? "Customer journey operating normally"}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted">
                {activeIncident?.businessImpact ?? "Current reliability signals are not linked to an open business-impact incident."}
              </p>
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="rounded-[24px] border border-line bg-surface p-5 shadow-[0_12px_35px_rgba(29,58,68,0.05)] sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand">Change intelligence</p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.035em] text-ink">Deployments</h2>
            </div>
            <GitCommitHorizontal aria-hidden="true" className="size-5 text-brand" />
          </div>
          <div className="mt-5 space-y-3">
            {deployments.length ? deployments.map((deployment) => (
              <div key={deployment.id} className="rounded-2xl border border-line bg-[#f8fafb] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-mono text-sm font-semibold text-ink">{deployment.version}</p>
                  <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${deploymentStyles[deployment.status]}`}>{formatStatus(deployment.status)}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted">{deployment.changeSummary}</p>
                <p className="mt-3 text-[11px] text-muted">{formatDateTime(deployment.deployedAt)} SGT · {deployment.deployedBy}</p>
              </div>
            )) : (
              <div className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">No recent deployment is linked to this service.</div>
            )}
          </div>
        </article>

        <article className="rounded-[24px] border border-line bg-surface p-5 shadow-[0_12px_35px_rgba(29,58,68,0.05)] sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand">Correlated evidence</p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.035em] text-ink">Logs and traces</h2>
            </div>
            <Code2 aria-hidden="true" className="size-5 text-brand" />
          </div>
          <div className="mt-5 space-y-3">
            {telemetry.length ? telemetry.map((event) => (
              <div key={event.id} className="rounded-2xl border border-line p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${telemetryStyles[event.level]}`}>{event.level}</span>
                  <span className="rounded-full bg-[#edf3f5] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-muted">{event.kind}</span>
                  <span className="ml-auto text-[11px] text-muted">{formatTime(event.occurredAt)} SGT</span>
                </div>
                <p className="mt-3 text-sm font-semibold text-ink">{event.source}</p>
                <p className="mt-1 text-sm leading-6 text-muted">{event.message}</p>
                {event.traceId ? <p className="mt-2 font-mono text-[10px] text-brand">{event.traceId}{event.durationMs ? ` · ${event.durationMs} ms` : ""}</p> : null}
              </div>
            )) : (
              <div className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">No elevated telemetry events for this service.</div>
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[24px] border border-line bg-surface p-5 shadow-[0_12px_35px_rgba(29,58,68,0.05)] sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand">Recovery engineering</p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.035em] text-ink">Readiness checks</h2>
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold text-ink">{portfolioSummary.recoveryReadiness}%</p>
              <p className="text-[10px] uppercase tracking-[0.12em] text-muted">visible portfolio ready</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {recoveryChecks.length ? recoveryChecks.map((check) => {
              const CheckIcon = check.status === "PASS" ? CheckCircle2 : check.status === "FAIL" ? XCircle : AlertTriangle;
              return (
                <div key={check.id} className="rounded-2xl border border-line bg-[#f8fafb] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <span className={`flex size-9 items-center justify-center rounded-xl ${recoveryStyles[check.status]}`}><CheckIcon aria-hidden="true" className="size-4" /></span>
                    <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted">{check.category}</span>
                  </div>
                  <p className="mt-4 text-sm font-semibold text-ink">{check.name}</p>
                  <p className="mt-2 text-xs leading-5 text-muted">{check.detail}</p>
                  <p className="mt-3 text-[10px] text-muted">Verified {formatDateTime(check.lastVerifiedAt)} SGT</p>
                </div>
              );
            }) : (
              <div className="rounded-2xl border border-dashed border-line p-6 text-sm text-muted md:col-span-2">No recovery checks are recorded for this service.</div>
            )}
          </div>
        </article>

        <article className="rounded-[24px] border border-line bg-surface p-5 shadow-[0_12px_35px_rgba(29,58,68,0.05)] sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand">Full infrastructure</p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.035em] text-ink">Resource health and drift</h2>
            </div>
            <CloudCog aria-hidden="true" className="size-5 text-brand" />
          </div>
          <div className="mt-5 space-y-3">
            {infrastructure.map((resource) => (
              <div key={resource.id} className="flex items-start gap-3 rounded-2xl border border-line p-4">
                <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${resource.healthStatus === "HEALTHY" ? "bg-brand-soft text-brand" : "bg-[#fff1e5] text-warning"}`}>
                  {resource.kind.toLowerCase().includes("database") ? <DatabaseBackup aria-hidden="true" className="size-5" /> : resource.provider === "SAAS" ? <Boxes aria-hidden="true" className="size-5" /> : <ServerCog aria-hidden="true" className="size-5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-ink">{resource.name}</p>
                    <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${resource.driftStatus === "IN_SYNC" ? "bg-[#e7f7f2] text-[#087060]" : resource.driftStatus === "DRIFTED" ? "bg-[#fff0f0] text-[#b63f46]" : "bg-[#edf3f5] text-muted"}`}>{formatStatus(resource.driftStatus)}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted">{resource.provider} · {resource.kind} · {resource.region}</p>
                  <p className="mt-2 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.1em] text-muted"><RefreshCw aria-hidden="true" className="size-3" /> Managed by {formatStatus(resource.managedBy)}</p>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-4 rounded-[24px] border border-[#cce7e0] bg-[#ecf8f5] p-5 sm:grid-cols-2 lg:grid-cols-4 sm:p-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand">Visible services</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{portfolioSummary.serviceCount}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand">SLOs at risk</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{portfolioSummary.servicesAtRisk}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand">Average availability</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{portfolioSummary.availability.toFixed(3)}%</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand">Current traffic</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{portfolioSummary.traffic.toLocaleString()}/min</p>
        </div>
      </section>

      <p className="flex items-center justify-center gap-2 text-center text-[11px] leading-5 text-muted">
        <TimerReset aria-hidden="true" className="size-4" />
        All telemetry is deterministic portfolio demonstration data. No live customer, patient, or production cloud data is used.
      </p>
    </div>
  );
}
