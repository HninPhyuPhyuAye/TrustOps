"use client";

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  CircleGauge,
  Clock3,
  Globe2,
  MapPin,
  RadioTower,
  ServerCog,
  ShieldAlert,
  ShieldCheck,
  Siren,
} from "lucide-react";
import { useMemo, useState } from "react";

import { useWorkspace } from "@/components/workspace-provider";
import type { HealthStatus, Industry, Severity } from "@/domain/schemas";

const industryLabels: Record<Industry, string> = {
  LOGISTICS: "Logistics",
  HEALTHCARE: "Healthcare",
  PROFESSIONAL_SERVICES: "Professional services",
};

const statusStyles: Record<HealthStatus, string> = {
  HEALTHY: "border-[#cbe7df] bg-[#e7f7f2] text-[#087060]",
  DEGRADED: "border-[#f0dcc1] bg-[#fff6e8] text-[#a66317]",
  CRITICAL: "border-[#f0cfd1] bg-[#fff0f0] text-[#b63f46]",
  UNKNOWN: "border-line bg-[#f2f5f6] text-muted",
};

const severityStyles: Record<Severity, string> = {
  INFO: "bg-[#edf3f5] text-muted",
  LOW: "bg-[#e7f7f2] text-[#087060]",
  MEDIUM: "bg-[#fff4df] text-[#a66317]",
  HIGH: "bg-[#ffe8e8] text-[#b63f46]",
  CRITICAL: "bg-[#7f1d26] text-white",
};

function formatStatus(status: string) {
  return status.toLowerCase().replaceAll("_", " ");
}

export function CommandCentre() {
  const {
    selection,
    selectWorkspace,
    selectedOrganization,
    visibleOrganizationSummaries,
    visibleSnapshots,
    portfolioSummary,
  } = useWorkspace();
  const [assetView, setAssetView] = useState<"services" | "sites">("services");
  const isPortfolio = selection === "portfolio";
  const selectedSummary = visibleOrganizationSummaries[0];

  const visibleData = useMemo(() => {
    const services = visibleSnapshots.flatMap((snapshot) =>
      snapshot.services.map((service) => ({
        ...service,
        organizationName: snapshot.organization.shortName,
      })),
    );
    const sites = visibleSnapshots.flatMap((snapshot) =>
      snapshot.sites.map((site) => ({
        ...site,
        organizationName: snapshot.organization.shortName,
      })),
    );
    const incidents = visibleSnapshots
      .flatMap((snapshot) =>
        snapshot.incidents.map((incident) => ({
          ...incident,
          organizationName: snapshot.organization.shortName,
        })),
      )
      .filter((incident) => incident.status !== "RESOLVED")
      .sort((left, right) => right.startedAt.localeCompare(left.startedAt));

    return { services, sites, incidents };
  }, [visibleSnapshots]);

  const metrics = isPortfolio
    ? {
        attention: portfolioSummary.organizationsNeedingAttention,
        activeIncidents: portfolioSummary.activeIncidents,
        securitySignals: portfolioSummary.activeSecuritySignals,
        servicesAtRisk: portfolioSummary.servicesAtRisk,
        pendingApprovals: portfolioSummary.pendingApprovals,
        availability: portfolioSummary.averageAvailability,
      }
    : {
        attention: selectedSummary?.impactedSiteCount ?? 0,
        activeIncidents: selectedSummary?.activeIncidents ?? 0,
        securitySignals: selectedSummary?.activeSecuritySignals ?? 0,
        servicesAtRisk: selectedSummary?.servicesAtRisk ?? 0,
        pendingApprovals: selectedSummary?.pendingApprovals ?? 0,
        availability: selectedSummary?.availability ?? 100,
      };

  const kpis = [
    {
      label: isPortfolio ? "Companies at risk" : "Impacted sites",
      value: metrics.attention,
      helper: isPortfolio
        ? `of ${portfolioSummary.organizationCount} monitored`
        : `of ${selectedSummary?.siteCount ?? 0} locations`,
      icon: Building2,
      tone: "bg-[#fff3e2] text-[#a66317]",
    },
    {
      label: "Active incidents",
      value: metrics.activeIncidents,
      helper: metrics.activeIncidents ? "Requires coordinated response" : "No open incidents",
      icon: Siren,
      tone: "bg-[#ffe9e9] text-[#b63f46]",
    },
    {
      label: "Cyber signals",
      value: metrics.securitySignals,
      helper: "Active identity and posture findings",
      icon: ShieldAlert,
      tone: "bg-[#e7edff] text-[#405fa4]",
    },
    {
      label: "SLOs at risk",
      value: metrics.servicesAtRisk,
      helper: `${metrics.availability.toFixed(3)}% average availability`,
      icon: Activity,
      tone: "bg-[#e2f7f1] text-[#087060]",
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="relative overflow-hidden rounded-[30px] bg-ink px-6 py-8 text-white shadow-[0_24px_70px_rgba(7,25,35,0.2)] sm:px-8 sm:py-10 lg:px-10">
        <div className="absolute -right-20 -top-28 size-72 rounded-full border-[50px] border-[#0d806f]/30" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#a5b8c0]">
              <span className="signal-dot size-1.5 rounded-full bg-[#55ddc2]" />
              {isPortfolio ? "MSP portfolio live" : `${industryLabels[selectedOrganization!.industry]} tenant`}
            </div>
            <h1 className="mt-6 max-w-4xl text-4xl font-semibold leading-[1.03] tracking-[-0.055em] sm:text-5xl lg:text-6xl">
              {isPortfolio ? (
                <>
                  Three organisations,
                  <span className="block text-[#65ddc6]">one operating picture.</span>
                </>
              ) : (
                <>
                  {selectedOrganization?.shortName},
                  <span className="block text-[#65ddc6]">operational command.</span>
                </>
              )}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#a5b8c0] sm:text-lg">
              Reliability, cyber exposure, incidents, and business impact are
              correlated inside an authorised tenant boundary.
            </p>
          </div>

          <div className="grid min-w-60 grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6f8c97]">
                Pending approvals
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">{metrics.pendingApprovals}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6f8c97]">
                Data region
              </p>
              <p className="mt-2 text-sm font-semibold text-white">
                {selectedOrganization?.dataRegion ?? "Singapore"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Operational KPIs">
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

      {isPortfolio ? (
        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand">
                Managed portfolio
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-ink">
                Company posture
              </h2>
            </div>
            <p className="hidden text-xs text-muted sm:block">Select a company to isolate its data</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {visibleOrganizationSummaries.map((organization) => (
              <button
                key={organization.organizationId}
                type="button"
                className="group rounded-[22px] border border-line bg-surface p-5 text-left shadow-[0_12px_35px_rgba(29,58,68,0.05)] transition hover:-translate-y-0.5 hover:border-[#b9cbcf] hover:shadow-[0_18px_45px_rgba(29,58,68,0.09)]"
                onClick={() => selectWorkspace(organization.organizationId)}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-brand-soft font-bold text-brand-strong">
                    {organization.shortName
                      .split(" ")
                      .map((word) => word[0])
                      .slice(0, 2)
                      .join("")}
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${statusStyles[organization.healthStatus]}`}
                  >
                    {formatStatus(organization.healthStatus)}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold tracking-[-0.025em] text-ink">
                  {organization.shortName}
                </h3>
                <p className="mt-1 text-xs text-muted">{industryLabels[organization.industry]}</p>
                <div className="mt-5 grid grid-cols-3 gap-3 border-t border-line pt-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.12em] text-muted">Risk</p>
                    <p className="mt-1 text-sm font-semibold text-ink">{organization.riskScore}/100</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.12em] text-muted">Incidents</p>
                    <p className="mt-1 text-sm font-semibold text-ink">{organization.activeIncidents}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.12em] text-muted">Availability</p>
                    <p className="mt-1 text-sm font-semibold text-ink">
                      {organization.availability.toFixed(2)}%
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-brand-strong">
                  Open tenant workspace
                  <ArrowRight aria-hidden="true" className="size-4 transition group-hover:translate-x-0.5" />
                </div>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[26px] border border-line bg-surface p-5 shadow-[0_12px_35px_rgba(29,58,68,0.05)] sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand">
                Live estate
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-ink">
                Services and sites
              </h2>
            </div>
            <div className="flex rounded-xl bg-[#edf3f4] p-1">
              {(["services", "sites"] as const).map((view) => (
                <button
                  key={view}
                  type="button"
                  className={`rounded-lg px-3 py-2 text-xs font-semibold capitalize transition ${
                    assetView === view ? "bg-surface text-ink shadow-sm" : "text-muted"
                  }`}
                  onClick={() => setAssetView(view)}
                >
                  {view}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {assetView === "services"
              ? visibleData.services.map((service) => (
                  <div
                    key={service.id}
                    className="grid gap-4 rounded-2xl border border-line bg-[#f8fafb] p-4 sm:grid-cols-[1fr_auto] sm:items-center"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e5edff] text-[#405fa4]">
                        <ServerCog aria-hidden="true" className="size-5" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-ink">{service.name}</p>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.12em] ${statusStyles[service.healthStatus]}`}
                          >
                            {formatStatus(service.healthStatus)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted">
                          {service.organizationName} · {service.businessProcess}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-5 text-left sm:text-right">
                      <div>
                        <p className="text-[9px] uppercase tracking-[0.12em] text-muted">Availability</p>
                        <p className="mt-1 text-xs font-semibold text-ink">
                          {service.currentAvailability}%
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase tracking-[0.12em] text-muted">P95</p>
                        <p className="mt-1 text-xs font-semibold text-ink">{service.latencyP95Ms} ms</p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase tracking-[0.12em] text-muted">Errors</p>
                        <p className="mt-1 text-xs font-semibold text-ink">
                          {service.errorRatePercent}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              : visibleData.sites.map((site) => (
                  <div
                    key={site.id}
                    className="flex items-center gap-3 rounded-2xl border border-line bg-[#f8fafb] p-4"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-strong">
                      <MapPin aria-hidden="true" className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-ink">{site.name}</p>
                      <p className="mt-1 text-xs text-muted">
                        {site.organizationName} · {site.code} · {formatStatus(site.kind)}
                      </p>
                    </div>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${statusStyles[site.healthStatus]}`}
                    >
                      {formatStatus(site.healthStatus)}
                    </span>
                  </div>
                ))}
          </div>
        </article>

        <article className="rounded-[26px] border border-line bg-surface p-5 shadow-[0_12px_35px_rgba(29,58,68,0.05)] sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand">
                Business impact
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-ink">
                Active incidents
              </h2>
            </div>
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#ffe9e9] text-[#b63f46]">
              <RadioTower aria-hidden="true" className="size-5" />
            </span>
          </div>

          <div className="mt-6 space-y-3">
            {visibleData.incidents.length ? (
              visibleData.incidents.map((incident) => (
                <div key={incident.id} className="rounded-2xl border border-line p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${severityStyles[incident.severity]}`}
                    >
                      {incident.severity}
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] font-medium text-muted">
                      <Clock3 aria-hidden="true" className="size-3.5" />
                      {formatStatus(incident.status)}
                    </span>
                  </div>
                  <h3 className="mt-3 font-semibold leading-6 text-ink">{incident.title}</h3>
                  <p className="mt-2 text-xs font-semibold text-brand-strong">
                    {incident.organizationName}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted">{incident.businessImpact}</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-[#cbe7df] bg-[#ecf8f5] p-6 text-center">
                <CheckCircle2 aria-hidden="true" className="mx-auto size-7 text-brand" />
                <p className="mt-3 font-semibold text-ink">No active incidents</p>
                <p className="mt-1 text-sm text-muted">All known events are resolved.</p>
              </div>
            )}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-[#f3f7f8] p-4">
              <CircleGauge aria-hidden="true" className="size-5 text-brand" />
              <p className="mt-3 text-[10px] uppercase tracking-[0.12em] text-muted">Risk posture</p>
              <p className="mt-1 text-lg font-semibold text-ink">
                {isPortfolio ? portfolioSummary.averageRiskScore : selectedSummary?.riskScore}/100
              </p>
            </div>
            <div className="rounded-2xl bg-[#f3f7f8] p-4">
              {metrics.securitySignals ? (
                <AlertTriangle aria-hidden="true" className="size-5 text-warning" />
              ) : (
                <ShieldCheck aria-hidden="true" className="size-5 text-brand" />
              )}
              <p className="mt-3 text-[10px] uppercase tracking-[0.12em] text-muted">Signal posture</p>
              <p className="mt-1 text-lg font-semibold text-ink">
                {metrics.securitySignals ? "Attention" : "Protected"}
              </p>
            </div>
          </div>
        </article>
      </section>

      <section className="flex flex-col gap-4 rounded-[24px] border border-[#cbe7df] bg-[#e9f7f3] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface text-brand shadow-sm">
            <Globe2 aria-hidden="true" className="size-5" />
          </span>
          <div>
            <p className="font-semibold text-ink">Tenant boundary enforced</p>
            <p className="mt-1 text-sm leading-6 text-muted">
              This view contains only records authorised for the selected workspace.
            </p>
          </div>
        </div>
        <span className="w-fit rounded-full bg-surface px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-strong shadow-sm">
          Demo data · no customer records
        </span>
      </section>
    </div>
  );
}
