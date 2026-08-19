import { z } from "zod";

const id = z.string().min(1);
const tenantEntity = z.object({
  id,
  organizationId: id,
});

export const industrySchema = z.enum([
  "LOGISTICS",
  "HEALTHCARE",
  "PROFESSIONAL_SERVICES",
]);

export const healthStatusSchema = z.enum([
  "HEALTHY",
  "DEGRADED",
  "CRITICAL",
  "UNKNOWN",
]);

export const severitySchema = z.enum(["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"]);

export const organizationSchema = z.object({
  id,
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(2),
  shortName: z.string().min(2),
  industry: industrySchema,
  country: z.string().length(2),
  timezone: z.string().min(1),
  dataRegion: z.string().min(1),
  healthStatus: healthStatusSchema,
  riskScore: z.number().int().min(0).max(100),
});

export const siteSchema = tenantEntity.extend({
  name: z.string().min(2),
  code: z.string().min(2),
  city: z.string().min(2),
  country: z.string().length(2),
  kind: z.enum(["HEADQUARTERS", "OPERATIONS", "CLINIC", "OFFICE", "DATA_CENTRE"]),
  healthStatus: healthStatusSchema,
});

export const serviceSchema = tenantEntity.extend({
  name: z.string().min(2),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  owningTeam: z.string().min(2),
  environment: z.enum(["PRODUCTION", "STAGING", "CORPORATE"]),
  criticality: z.enum(["TIER_1", "TIER_2", "TIER_3"]),
  healthStatus: healthStatusSchema,
  siteIds: z.array(id).min(1),
  businessProcess: z.string().min(3),
  availabilityTarget: z.number().min(90).max(100),
  currentAvailability: z.number().min(0).max(100),
  latencyP95Ms: z.number().nonnegative(),
  errorRatePercent: z.number().nonnegative(),
  saturationPercent: z.number().min(0).max(100),
});

export const assetSchema = tenantEntity.extend({
  name: z.string().min(2),
  kind: z.enum([
    "CLOUD_ACCOUNT",
    "DATABASE",
    "CONTAINER_SERVICE",
    "IDENTITY_PROVIDER",
    "ENDPOINT",
    "NETWORK_DEVICE",
    "SAAS_APPLICATION",
  ]),
  provider: z.string().min(2),
  serviceId: id.optional(),
  siteId: id.optional(),
  exposure: z.enum(["INTERNAL", "INTERNET_FACING", "RESTRICTED"]),
  riskScore: z.number().int().min(0).max(100),
  healthStatus: healthStatusSchema,
});

export const signalSchema = tenantEntity.extend({
  title: z.string().min(3),
  summary: z.string().min(5),
  source: z.enum([
    "METRICS",
    "LOGS",
    "TRACES",
    "IDENTITY",
    "ENDPOINT",
    "CLOUD_POSTURE",
    "NETWORK",
  ]),
  kind: z.enum(["RELIABILITY", "SECURITY"]),
  severity: severitySchema,
  status: z.enum(["ACTIVE", "ACKNOWLEDGED", "RESOLVED"]),
  occurredAt: z.iso.datetime(),
  serviceId: id.optional(),
  assetId: id.optional(),
  value: z.number().optional(),
  unit: z.string().optional(),
  threshold: z.number().optional(),
});

export const incidentSchema = tenantEntity.extend({
  title: z.string().min(3),
  status: z.enum(["INVESTIGATING", "CONTAINED", "MONITORING", "RESOLVED"]),
  severity: severitySchema,
  startedAt: z.iso.datetime(),
  resolvedAt: z.iso.datetime().optional(),
  commander: z.string().min(2),
  businessImpact: z.string().min(5),
  signalIds: z.array(id).min(1),
  serviceIds: z.array(id),
  assetIds: z.array(id),
  correlationKey: z.string().min(3),
});

export const evidenceSchema = tenantEntity.extend({
  incidentId: id,
  signalId: id.optional(),
  observedAt: z.iso.datetime(),
  sourceLabel: z.string().min(2),
  statement: z.string().min(5),
  supportsHypothesis: z.boolean(),
});

export const aiInvestigationSchema = tenantEntity.extend({
  incidentId: id,
  generatedAt: z.iso.datetime(),
  modelLabel: z.string().min(2),
  hypothesis: z.string().min(10),
  confidence: z.number().min(0).max(1),
  blastRadius: z.string().min(5),
  evidenceIds: z.array(id).min(1),
  limitations: z.array(z.string().min(3)).min(1),
  simulated: z.literal(true),
});

export const runbookSchema = tenantEntity.extend({
  name: z.string().min(3),
  description: z.string().min(5),
  action: z.enum([
    "DISABLE_ACCOUNT",
    "REVOKE_TOKEN",
    "BLOCK_ADDRESS",
    "RESTART_SERVICE",
    "ROLLBACK_DEPLOYMENT",
  ]),
  risk: z.enum(["LOW", "MEDIUM", "HIGH"]),
  requiresApproval: z.literal(true),
  verificationSteps: z.array(z.string().min(3)).min(1),
});

export const approvalSchema = tenantEntity.extend({
  incidentId: id,
  runbookId: id,
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "EXPIRED"]),
  requestedAt: z.iso.datetime(),
  requestedBy: z.string().min(2),
  decidedAt: z.iso.datetime().optional(),
  decidedBy: z.string().optional(),
  rationale: z.string().optional(),
});

export const automationExecutionSchema = tenantEntity.extend({
  incidentId: id,
  runbookId: id,
  approvalId: id,
  status: z.enum(["QUEUED", "RUNNING", "SUCCEEDED", "FAILED", "ROLLED_BACK"]),
  startedAt: z.iso.datetime().optional(),
  completedAt: z.iso.datetime().optional(),
  verificationResult: z.string().optional(),
  simulated: z.literal(true),
});

export const infrastructureResourceSchema = tenantEntity.extend({
  name: z.string().min(2),
  provider: z.enum(["AWS", "AZURE", "GCP", "ON_PREMISE", "SAAS"]),
  kind: z.string().min(2),
  region: z.string().min(2),
  environment: z.enum(["PRODUCTION", "STAGING", "CORPORATE"]),
  managedBy: z.enum(["TERRAFORM", "CLOUDFORMATION", "MANUAL", "VENDOR"]),
  healthStatus: healthStatusSchema,
  driftStatus: z.enum(["IN_SYNC", "DRIFTED", "NOT_ASSESSED"]),
});

export const auditEventSchema = tenantEntity.extend({
  occurredAt: z.iso.datetime(),
  actor: z.string().min(2),
  actorType: z.enum(["USER", "SYSTEM", "AI_AGENT"]),
  action: z.string().min(3),
  targetType: z.string().min(2),
  targetId: id,
  outcome: z.enum(["ALLOWED", "DENIED", "SUCCEEDED", "FAILED"]),
  summary: z.string().min(5),
});

export const trustOpsDatasetSchema = z.object({
  organizations: z.array(organizationSchema).min(1),
  sites: z.array(siteSchema),
  services: z.array(serviceSchema),
  assets: z.array(assetSchema),
  signals: z.array(signalSchema),
  incidents: z.array(incidentSchema),
  evidence: z.array(evidenceSchema),
  aiInvestigations: z.array(aiInvestigationSchema),
  runbooks: z.array(runbookSchema),
  approvals: z.array(approvalSchema),
  automationExecutions: z.array(automationExecutionSchema),
  infrastructureResources: z.array(infrastructureResourceSchema),
  auditEvents: z.array(auditEventSchema),
});

export type Industry = z.infer<typeof industrySchema>;
export type HealthStatus = z.infer<typeof healthStatusSchema>;
export type Severity = z.infer<typeof severitySchema>;
export type Organization = z.infer<typeof organizationSchema>;
export type Site = z.infer<typeof siteSchema>;
export type Service = z.infer<typeof serviceSchema>;
export type Asset = z.infer<typeof assetSchema>;
export type Signal = z.infer<typeof signalSchema>;
export type Incident = z.infer<typeof incidentSchema>;
export type Evidence = z.infer<typeof evidenceSchema>;
export type AiInvestigation = z.infer<typeof aiInvestigationSchema>;
export type Runbook = z.infer<typeof runbookSchema>;
export type Approval = z.infer<typeof approvalSchema>;
export type AutomationExecution = z.infer<typeof automationExecutionSchema>;
export type InfrastructureResource = z.infer<typeof infrastructureResourceSchema>;
export type AuditEvent = z.infer<typeof auditEventSchema>;
export type TrustOpsDataset = z.infer<typeof trustOpsDatasetSchema>;
