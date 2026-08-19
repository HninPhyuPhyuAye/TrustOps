# TrustOps multi-tenant data model

## Purpose

Task 3 establishes a validated demonstration domain that every later dashboard
and workflow can reuse. The records are realistic simulations and contain no
real company, employee, patient, or client data.

## Tenant boundary

An organisation is the tenant root. Every operational record carries an
`organizationId`, including sites, services, assets, signals, incidents,
evidence, AI investigations, runbooks, approvals, automation executions,
infrastructure resources, and audit events.

The application does not expose the raw fixture collections to feature code.
Callers provide a `TenantAccessContext` to the tenant repository, which then:

1. checks that the actor is allowed to access the requested organisation;
2. returns only records with the same `organizationId`;
3. rejects unauthorised access before reading the tenant snapshot.

Dataset integrity validation also checks relational references. An incident
cannot include a signal, service, or asset from another tenant, and an approval
cannot refer to another tenant's incident or runbook.

## Demonstration organisations

| Tenant | Industry | Scenario |
| --- | --- | --- |
| Meridian Logistics | Logistics and supply chain | Privileged activity correlated with tracking and dispatch degradation |
| HarbourCare Health | Private healthcare | Clinic queue saturation observed alongside unrelated backup-policy drift |
| Northstar Advisory | Professional services | Prevented phishing and account-takeover attempt with verified token revocation |

## Operational graph

```text
Organisation
├── Sites
├── Services ── SLO and golden-signal measurements
├── Assets ──── exposure, risk, health, and ownership
├── Signals ─── reliability or security evidence
└── Incidents
    ├── Evidence
    ├── Simulated AI investigation
    ├── Runbook and approval
    ├── Simulated automation execution
    └── Audit events
```

## Safety characteristics

- AI investigation fixtures are explicitly marked `simulated: true`.
- Every runbook requires approval.
- Automation records represent demonstrations, not real production actions.
- Infrastructure records describe posture and drift without provisioning cloud
  resources.
- Fixed timestamps make screenshots, tests, and interview demonstrations
  reproducible.
