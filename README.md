# TrustOps AI

TrustOps AI is a portfolio-grade, multi-tenant digital resilience platform for
Singapore SMEs and managed service providers. It brings SRE observability, SOC
monitoring, incident analysis, and human-approved automation into one command
centre.

## Product promise

When an operational failure and a security signal happen at the same time,
TrustOps correlates the evidence into one incident, explains the likely business
impact, recommends an approved runbook, and verifies recovery without allowing
an AI agent to make uncontrolled production changes.

## Target users

- SME and mid-market IT teams
- Managed service providers (MSPs)
- Managed security service providers (MSSPs)
- SRE, SOC, support, and infrastructure engineers
- Technology and risk leaders

## Initial industry demonstrations

- Logistics and supply chain
- Private healthcare
- Professional services

## Two-day MVP

The two-day build is an intentionally focused demonstration. It will simulate
realistic telemetry and response workflows while keeping the interfaces clean
enough to connect to real collectors and cloud services later.

See [docs/DELIVERY_PLAN.md](docs/DELIVERY_PLAN.md) for the detailed scope,
acceptance criteria, and delivery order.

## Planned stack

- Next.js App Router and React
- TypeScript
- Tailwind CSS
- PostgreSQL-compatible domain model
- Recharts for operational visualisation
- Zod for runtime validation
- Vitest and Testing Library
- Docker and GitHub Actions
- Terraform reference architecture for AWS

## Safety boundary

The AI layer prepares evidence-backed recommendations. A deterministic policy
engine and an authorised human must approve consequential automation. Every
approval and runbook execution is recorded in an audit trail.

## Cloud delivery rule

AWS integrations will be represented as reviewed Terraform infrastructure as
code. The project will not depend on manually created console resources, and no
chargeable infrastructure is provisioned by default.

## Status

Task 5 complete: the tenant-aware SRE workspace now connects golden signals,
SLO and error-budget burn, time-series telemetry, deployments, logs, traces,
business impact, recovery readiness, and infrastructure drift. All telemetry is
deterministic demonstration data. See [the observability model](docs/OBSERVABILITY.md)
and [the data model](docs/DATA_MODEL.md) for the operating logic and tenant
boundary. Task 6 will add the SOC and cyber-monitoring workspace.
