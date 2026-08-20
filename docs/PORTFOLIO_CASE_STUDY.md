# TrustOps AI — portfolio case study

## One-line project card

Multi-tenant digital-resilience command centre combining SRE, SOC,
evidence-linked AI incident analysis, and human-approved automation.

## Short portfolio description

TrustOps helps managed service providers and mid-market IT teams understand
reliability failures and cyber threats in one operating picture. I designed a
tenant-safe workflow that correlates SRE and SOC evidence, explains a simulated
AI root-cause hypothesis, enforces human approval before automation, verifies
recovery, and preserves an audit trail. The project includes a hardened Docker
release, GitHub Actions security gates, operational runbooks, and a
disabled-by-default AWS Terraform architecture.

## Problem

Operational and security alerts are commonly separated across different tools.
During a high-impact incident, teams lose time reconstructing which customer,
service, site, and business process are affected—and who is authorised to act.

## Solution

- Portfolio and tenant command centres for three Singapore industry scenarios.
- SRE golden signals, SLO burn, deployments, logs, traces, and recovery health.
- SOC detections, attack-path context, cloud exposure, controls, and MITRE tags.
- Unified incident timeline and evidence-linked simulated AI analysis.
- Tenant/role policy checks, human decisions, controlled runbook simulations,
  verification, and exportable audit history.
- Production-style container, CI, security scanning, runbooks, and modular AWS
  infrastructure as code with zero resources enabled by default.

## My contribution

Individual project: product framing, interaction design, TypeScript domain
model, tenant boundary, correlation logic, policy engine, SRE/SOC dashboards,
automation workflow, tests, container delivery, CI, threat model, runbooks, and
Terraform reference architecture.

## Technology

Next.js 16, React 19, TypeScript, Tailwind CSS, Zod, Recharts, Vitest, Docker,
GitHub Actions, Trivy, and Terraform for AWS ECS, ECR, ALB, RDS, VPC, IAM,
CloudWatch, autoscaling, and alerting.

## Engineering evidence

- 19 automated tests plus lint, type-check, and production-build gates.
- Dependency audit and high/critical container scanning in CI.
- Non-root, read-only, capability-dropped container profile.
- Tenant-integrity validation and role/tenant/risk automation policies.
- Cost-acknowledged, disabled-by-default Terraform producing a zero-resource
  plan until a deployment is deliberately authorised.

## Suggested project-card labels

`Next.js` · `TypeScript` · `SRE` · `SOC` · `AI governance` · `Docker` ·
`GitHub Actions` · `Terraform` · `AWS architecture`
