# TrustOps interview guide

## Thirty-second introduction

> TrustOps is a multi-tenant digital-resilience platform I designed for
> Singapore SMEs and managed service providers. It combines SRE reliability,
> SOC monitoring, explainable AI-assisted incident analysis, and
> approval-controlled automation. The key design decision is that AI can build
> an evidence-linked recommendation, but a deterministic policy engine and an
> authorised human must approve any consequential action. I also built the
> delivery path with tests, a hardened container, CI security gates, runbooks,
> and disabled-by-default AWS Terraform.

## The real-world story

Meridian Logistics experiences a shipment-tracking slowdown while unusual
identity and network activity appears around the same service. Separate tools
would give SRE and SOC different alert queues. TrustOps maps both signal types
to the affected service, site, customer workflow, and incident. Its simulated
AI analyst proposes a root-cause hypothesis with confidence, citations,
counter-evidence, and limitations. It retrieves a reviewed runbook, checks the
operator's tenant and role, requires a written approval, simulates the action,
verifies recovery, and records the entire decision chain.

## Five-minute demonstration

1. **Command centre:** begin in the portfolio view. Explain the three industries,
   health posture, active incidents, cyber signals, SLO risk, and business impact.
2. **Tenant isolation:** switch to Meridian Logistics. Point out that all service,
   incident, and security data now belongs only to that tenant.
3. **SRE:** open the reliability workspace. Trace availability, p95 latency,
   errors, saturation, error-budget burn, deployments, logs, and traces.
4. **SOC:** open the security workspace. Connect identity/network detections,
   MITRE context, affected assets, exposure, and controls.
5. **Incident and AI:** open the correlated incident and AI analyst. Show cited
   evidence, counter-evidence, blast radius, limitations, and stakeholder draft.
6. **Automation:** review the proposed runbook. Approve or reject with a reason,
   run the safe simulation, and inspect verification.
7. **Audit and infrastructure:** show the attributed event chain, then explain the
   container, CI, and zero-resource Terraform safety gates.

## Architecture explanation

The application separates four responsibilities:

- **Domain and tenant repository:** validated entities and tenant-scoped queries.
- **Correlation and analysis:** joins SRE/SOC evidence into deterministic,
  repeatable incident cases.
- **Policy and execution:** keeps authorisation separate from recommendation and
  only permits allow-listed simulations.
- **Delivery platform:** hardened standalone container, GitHub Actions quality
  gates, and modular Terraform for network, platform, and monitoring layers.

The production evolution would replace fixtures with read-only telemetry
adapters, use enterprise identity and PostgreSQL row-level security, connect a
governed model endpoint, and separate policy, workers, credentials, and audit
storage.

## Decisions and trade-offs

### Why deterministic AI output?

The two-day prototype must be safe, repeatable, free to demonstrate, and easy to
evaluate. Deterministic analysis lets tests assert evidence and tenant boundaries
without pretending that a live model is always correct. The interface and domain
contract are ready for a governed provider adapter later.

### Why human approval instead of full autonomy?

Incident recommendations can be wrong, telemetry can be malicious, and roles
have different authority. Separating analysis, policy decision, approval, and
execution gives engineers a clear control point and creates audit evidence.

### Why synthetic data?

The goal is to demonstrate architecture and operational reasoning without
collecting customer, employee, health, payment, or credential data. Fixed
fixtures also make the demo and automated tests reproducible.

### Why Terraform without deploying AWS?

It demonstrates cloud architecture and infrastructure-as-code while preventing
surprise costs. Every resource is gated, cost acknowledgement is separate, CI
never applies, and a real deployment requires an immutable image digest.

### What would you build next?

1. OIDC/SSO, MFA, roles, and server-side tenant authorisation.
2. PostgreSQL persistence with row-level security and migration controls.
3. OpenTelemetry plus read-only AWS Security Hub/GuardDuty/CloudWatch adapters.
4. A governed model adapter with evaluation, prompt-injection defences, and
   structured tool contracts.
5. A separated execution worker using short-lived credentials and signed audit
   evidence.
6. TLS/WAF, remote Terraform state, deployment approvals, backups, and recovery
   exercises.

## Evidence to mention

- Three organisations across logistics, private healthcare, and professional
  services with validated tenant relationships.
- Nineteen automated domain and health-route tests at Task 10 release time.
- GitHub Actions gates application quality, dependency audit, container build,
  high/critical vulnerability scan, and Terraform validation.
- The local production image has no high/critical findings in the release scan.
- The default Terraform plan creates zero resources and makes no AWS call.

## Honest boundaries

Say clearly that TrustOps is a portfolio architecture and workflow prototype.
It is not a production SIEM, does not ingest real telemetry, does not call a live
AI model, and cannot modify real infrastructure. Explain the missing controls
before claiming a production path; this shows engineering judgement rather than
weakening the project.
