import type { OrganizationSnapshot } from "@/domain/tenant-repository";

function round(value: number, decimals = 0) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function summarizeSocWorkspace(snapshot: OrganizationSnapshot) {
  const signalById = new Map(snapshot.signals.map((signal) => [signal.id, signal]));
  const activeDetections = snapshot.securityDetections.filter(
    (detection) => signalById.get(detection.signalId)?.status !== "RESOLVED",
  );
  const highPriorityDetections = activeDetections.filter((detection) => {
    const severity = signalById.get(detection.signalId)?.severity;
    return severity === "HIGH" || severity === "CRITICAL";
  });
  const openFindings = snapshot.exposureFindings.filter(
    (finding) => finding.status === "OPEN",
  );
  const controlCount = snapshot.securityControls.length || 1;
  const effectiveControls = snapshot.securityControls.filter(
    (control) => control.status === "EFFECTIVE",
  ).length;

  return {
    detectionCount: snapshot.securityDetections.length,
    activeDetections: activeDetections.length,
    highPriorityDetections: highPriorityDetections.length,
    untriagedDetections: activeDetections.filter(
      (detection) => detection.disposition === "UNTRIAGED",
    ).length,
    openFindings: openFindings.length,
    highRiskAssets: snapshot.assets.filter((asset) => asset.riskScore >= 60).length,
    internetFacingAssets: snapshot.assets.filter(
      (asset) => asset.exposure === "INTERNET_FACING",
    ).length,
    averageControlCoverage: round(
      snapshot.securityControls.reduce(
        (total, control) => total + control.coveragePercent,
        0,
      ) / controlCount,
    ),
    controlEffectiveness: round((effectiveControls / controlCount) * 100),
    meanDetectionConfidence:
      snapshot.securityDetections.length === 0
        ? 0
        : round(
            snapshot.securityDetections.reduce(
              (total, detection) => total + detection.confidence,
              0,
            ) / snapshot.securityDetections.length,
          ),
  };
}
