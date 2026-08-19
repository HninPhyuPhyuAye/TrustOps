# TrustOps observability model

Task 5 turns the validated multi-tenant service model into an explainable SRE
workspace. The interface uses deterministic demonstration telemetry so the
operating story is repeatable, safe, and reviewable without a live cloud bill.

## Golden signals

Each service exposes the core reliability signals used in the workspace:

- **Availability** compared with the service-level objective (SLO)
- **Latency** at the 95th percentile
- **Traffic** as requests or events per minute
- **Errors** as a percentage of sampled requests
- **Saturation** and remaining capacity headroom

The charts use fixed 15-minute samples and an explicit Singapore timezone. A
service selector respects the active MSP portfolio or tenant boundary.

## Error-budget burn

The demonstration burn indicator compares observed unavailability with the
unavailability allowed by the service objective:

```text
burn rate = (100 - observed availability) / (100 - SLO target)
```

A burn rate above `1x` means the service is consuming budget faster than its
objective allows. The UI deliberately labels this an explanatory indicator;
production paging would require multiple observation windows, minimum traffic,
and reviewed alert thresholds.

## Correlated operating context

The workspace connects metrics to:

- deployments and change summaries;
- application logs and distributed traces using shared trace identifiers;
- active incidents and their stated business impact;
- backup, failover, runbook, and capacity checks;
- infrastructure health, configuration drift, and infrastructure-as-code
  ownership.

This enables an interviewer to follow a realistic investigation from degraded
customer experience to a recent deployment, supporting telemetry, recovery
readiness, and the affected business process.

## Future live-cloud boundary

Task 5 does not create cloud resources. Future AWS collectors and dashboards
must be provisioned through reviewed Terraform, use read-only roles where
possible, keep tenant tags on every signal, and avoid enabling chargeable
infrastructure by default.
