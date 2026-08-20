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

## Engineering stack

- Next.js App Router and React
- TypeScript
- Tailwind CSS
- PostgreSQL-compatible domain model
- Recharts for operational visualisation
- Zod for runtime validation
- Vitest and Testing Library
- Docker and GitHub Actions
- Terraform reference architecture for AWS

## Run locally

Requirements: Node.js 24 and npm 11 or later.

```bash
cp .env.example .env.local
npm ci
npm run dev
```

Open `http://localhost:3000`. The operational health endpoint is available at
`http://localhost:3000/api/health`.

Run the full local quality gate with:

```bash
npm run verify
npm audit --omit=dev --audit-level=high
```

## Run the production container

With Docker Desktop running:

```bash
docker compose build
docker compose up -d
curl --fail http://localhost:3000/api/health
```

The multi-stage image runs the minimal Next.js standalone server as an
unprivileged user. See the [container release runbook](docs/runbooks/CONTAINER_RELEASE.md)
for verification and shutdown steps.

## Safety boundary

The AI layer prepares evidence-backed recommendations. A deterministic policy
engine and an authorised human must approve consequential automation. Every
approval and runbook execution is recorded in an audit trail.

## Cloud delivery rule

AWS integrations will be represented as reviewed Terraform infrastructure as
code. The project will not depend on manually created console resources, and no
chargeable infrastructure is provisioned by default.

The reference configuration models VPC networking, ECS Fargate, ECR, an ALB,
private encrypted RDS, CloudWatch, alarms, and least-privilege runtime roles. Both
`deployment_enabled` and `cost_acknowledged` default to `false`; CI validates the
configuration and never applies it. See [the AWS architecture](docs/AWS_ARCHITECTURE.md)
and [safe Terraform instructions](infra/terraform/README.md).

## Delivery evidence

- [CI pipeline](docs/CI_PIPELINE.md)
- [Security policy](SECURITY.md)
- [Local development runbook](docs/runbooks/LOCAL_DEVELOPMENT.md)
- [Incident response runbook](docs/runbooks/INCIDENT_RESPONSE.md)
- [Terraform review runbook](docs/runbooks/TERRAFORM_REVIEW.md)
- [Controlled teardown runbook](docs/runbooks/TEARDOWN.md)

## Status

Task 9 complete: TrustOps now has a production-style standalone container,
operational health endpoint, automated application/container/Terraform quality
gates, dependency update policy, disabled-by-default AWS reference modules, and
documented development, release, incident, infrastructure-review, and teardown
runbooks. The Terraform default produces a zero-resource plan and no AWS action
is performed by CI. Task 10 will complete marketplace positioning, final
portfolio evidence, the threat model, and interview handoff.
