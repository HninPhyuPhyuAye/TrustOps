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

Task 4 complete: the responsive MSP command centre now supports portfolio and
tenant views, persistent organisation switching, operational KPIs, company
posture, business-impact incidents, and interactive service/site visibility.
See [the data model](docs/DATA_MODEL.md) for the tenant boundary and scenarios.
Task 5 will deepen the service data into the SRE observability workspace.
