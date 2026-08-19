import type { Service } from "@/domain/schemas";
import type { OrganizationSnapshot } from "@/domain/tenant-repository";

function round(value: number, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function calculateErrorBudgetBurn(service: Service) {
  const allowedUnavailability = Math.max(100 - service.availabilityTarget, 0.001);
  const observedUnavailability = Math.max(100 - service.currentAvailability, 0);
  return round(observedUnavailability / allowedUnavailability, 2);
}

export function summarizeSreWorkspace(snapshot: OrganizationSnapshot) {
  const serviceCount = snapshot.services.length || 1;
  const latestMetrics = snapshot.services.flatMap((service) => {
    const points = snapshot.serviceMetricPoints
      .filter((point) => point.serviceId === service.id)
      .sort((left, right) => right.observedAt.localeCompare(left.observedAt));
    return points[0] ? [points[0]] : [];
  });
  const recoveryPasses = snapshot.recoveryChecks.filter(
    (check) => check.status === "PASS",
  ).length;

  return {
    serviceCount: snapshot.services.length,
    servicesAtRisk: snapshot.services.filter(
      (service) => service.currentAvailability < service.availabilityTarget,
    ).length,
    availability: round(
      snapshot.services.reduce(
        (total, service) => total + service.currentAvailability,
        0,
      ) / serviceCount,
      3,
    ),
    latencyP95Ms: Math.max(
      0,
      ...snapshot.services.map((service) => service.latencyP95Ms),
    ),
    errorRatePercent: round(
      snapshot.services.reduce(
        (total, service) => total + service.errorRatePercent,
        0,
      ) / serviceCount,
      2,
    ),
    saturationPercent: Math.max(
      0,
      ...snapshot.services.map((service) => service.saturationPercent),
    ),
    trafficPerMinute: latestMetrics.reduce(
      (total, metric) => total + metric.trafficPerMinute,
      0,
    ),
    maximumBurnRate: Math.max(
      0,
      ...snapshot.services.map(calculateErrorBudgetBurn),
    ),
    recoveryReadiness:
      snapshot.recoveryChecks.length === 0
        ? 100
        : round((recoveryPasses / snapshot.recoveryChecks.length) * 100, 0),
  };
}
