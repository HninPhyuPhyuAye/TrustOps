# TrustOps AI — Two-Day Delivery Plan

## Outcome

Deliver an interview-ready web application that demonstrates how a shared
platform can monitor reliability and cybersecurity across multiple companies,
correlate incidents, assist an engineer with explainable AI analysis, and run
approved recovery simulations.

This is not presented as a production replacement for a SIEM, EDR, or enterprise
observability platform. It is a credible architectural and workflow prototype.

## Day 1 — Visibility and incident correlation

### Task 1: Workspace and delivery contract

- Create an isolated `TrustOps` Git repository.
- Record the target customers, safety boundary, stack, and acceptance criteria.
- Confirm the local Node, npm, Git, and GitHub environment.

### Task 2: Application foundation

- Scaffold Next.js with TypeScript, Tailwind CSS, linting, and formatting.
- Create the TrustOps visual language and responsive application shell.
- Establish route and component conventions.

### Task 3: Multi-tenant domain

- Model organisations, sites, services, assets, signals, incidents, runbooks,
  approvals, and audit events.
- Add realistic logistics, healthcare, and professional-services fixtures.
- Enforce tenant-aware access boundaries in application services.

### Task 4: Company command centre

- Add organisation switching and cross-company MSP view.
- Show company health, active incidents, cyber risk, SLO status, and business
  impact.
- Add an interactive service and site overview.

### Task 5: SRE workspace

- Show availability, latency, traffic, errors, saturation, and SLO burn.
- Add deployments, infrastructure health, logs, traces, and recovery readiness.
- Connect a service failure to its customer and business impact.

### Task 6: SOC workspace

- Show detections, identity anomalies, vulnerable assets, configuration drift,
  and attack activity.
- Add severity, confidence, evidence, and affected-asset views.
- Correlate security and reliability signals.

## Day 2 — Investigation, automation, and delivery

### Task 7: Unified incident and AI investigation

- Build a single incident timeline containing SRE and SOC evidence.
- Generate an evidence-linked root-cause hypothesis and blast-radius summary.
- Retrieve a relevant runbook and draft stakeholder communication.
- Label simulated AI output clearly and keep it deterministic for the demo.

### Task 8: Controlled automation

- Create an approval queue and role checks.
- Simulate safe runbooks such as disabling an account, revoking a token,
  blocking an address, restarting a service, and rolling back a deployment.
- Verify the outcome and append immutable-style audit events.

### Task 9: Engineering quality and infrastructure

- Add unit and integration tests for correlation, policy, and tenant isolation.
- Add CI, Docker, environment examples, and security checks.
- Add Terraform reference modules and an AWS architecture document without
  creating chargeable infrastructure by default.
- Define every AWS integration through reviewed Terraform configuration; do not
  rely on manually created console resources for the portfolio architecture.

### Task 10: Release and portfolio evidence

- Run formatting, tests, type checking, and the production build.
- Perform desktop and mobile workflow verification.
- Complete the README, architecture, threat model, runbook, and interview guide.
- Add a Marketplace Position section covering buyers, users, industry packs,
  differentiation, channels, and commercial model.
- Capture screenshots and publish the repository.

## MVP acceptance criteria

The project is complete when a reviewer can:

1. Switch among three isolated demonstration organisations.
2. See company-wide reliability and security posture.
3. Inspect SRE and SOC signals that combine into one incident.
4. Read evidence-backed AI analysis with uncertainty and source references.
5. Approve or reject a simulated recovery action.
6. See the recovery verification and audit trail.
7. Run the project locally from documented commands.
8. Verify formatting, tests, type checking, and production build in CI.

## Scope controls

- No uncontrolled autonomous remediation.
- No collection of real employee, customer, payment, or health data.
- No claim that the prototype provides production-grade security protection.
- No paid AWS resources are provisioned during the initial build.
- Real integrations remain replaceable adapters behind simulated data sources.

## Git delivery convention

- Keep `main` deployable.
- Commit one coherent, verified capability at a time.
- Push after successful verification and a meaningful commit.
- Never commit credentials, generated secrets, or local environment files.
