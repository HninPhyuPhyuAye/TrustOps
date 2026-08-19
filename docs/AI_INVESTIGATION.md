# TrustOps incident correlation and explainable AI

## Purpose

Task 7 joins reliability and security observations into one tenant-scoped
incident investigation. It demonstrates how an MSP analyst could understand an
operational problem without moving between disconnected SRE, SOC, ticketing,
and communication tools.

The current analyst is deterministic demonstration logic. It makes no external
model or cloud API calls, consumes no real customer data, and creates no usage
charges.

## Investigation flow

```text
Tenant workspace
  -> incident
     -> reliability and security signals
     -> source-labelled evidence and counter-evidence
     -> chronological response timeline
     -> simulated AI hypothesis
        -> confidence
        -> cited evidence
        -> blast radius
        -> known limitations
     -> tenant-scoped runbook recommendation
     -> draft stakeholder update
```

`buildIncidentCases` is the correlation boundary. It receives an already
authorised `OrganizationSnapshot`, resolves only references inside that tenant,
orders events by their fixed timestamps, and returns a presentation-safe case.

## Explainability contract

Every simulated AI investigation displays:

- a leading hypothesis rather than a statement of fact;
- a numeric confidence score;
- the exact evidence records cited by the conclusion;
- evidence that challenges the hypothesis;
- the affected services, assets, and business blast radius;
- known limitations and missing telemetry;
- a visible `Simulated output` label.

The interface does not hide uncertainty or imply that an LLM has authority to
change production systems.

## Automation boundary

Runbook retrieval is advisory in Task 7. Every runbook is tenant-scoped and
declares `requiresApproval: true`. The incident workspace can recommend an
action, but it cannot execute it. Task 8 adds explicit approval, rejection,
simulation, verification, and audit states.

## Communication safety

Stakeholder messages are deterministic drafts based on the incident status,
business impact, and current hypothesis. They are marked for incident-commander
review and are not sent by the application.

## Production evolution

A production implementation could place provider adapters behind this domain:

- OpenTelemetry, CloudWatch, or managed observability events for SRE evidence;
- Security Hub, GuardDuty, identity, endpoint, and network events for SOC
  evidence;
- Bedrock or another governed model endpoint for assisted analysis;
- a retrieval store containing approved tenant runbooks;
- an append-only audit service for analyst decisions and model provenance.

Those AWS integrations will be represented only through reviewed Terraform in
the infrastructure task. No console-created or chargeable resources are needed
for the current portfolio demonstration.
