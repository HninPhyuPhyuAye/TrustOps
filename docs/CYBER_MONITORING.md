# TrustOps cyber-monitoring model

Task 6 adds a tenant-aware SOC workspace for identity, endpoint, cloud, and
network monitoring. It is deliberately built with deterministic demonstration
data: no real identities, customer records, endpoints, or cloud accounts are
connected.

## Detection pipeline

Each detection links a source security signal to an affected asset and adds the
context an analyst needs to make a decision:

- severity, confidence, event count, and observation window;
- entity and source location;
- triage disposition;
- MITRE ATT&CK-aligned tactic, technique identifier, and technique name;
- any related service, incident, and stated business impact.

The UI turns these relationships into an attack-path view from the observed
entity to the asset and operational outcome. It never presents correlation as
proof: analyst review remains required.

## Attack surface and controls

Exposure findings cover public exposure, excessive privilege,
misconfiguration, and vulnerabilities. Every finding references a tenant-owned
asset, remediation guidance, and control identifiers. Preventive controls show
coverage, monitored-asset count, and one of three review states: effective,
partial, or gap.

## Tenant and automation safety

- Repository queries filter every SOC record by organisation.
- Dataset validation rejects cross-tenant signal and asset references.
- Detection selection and source filters operate only on the active workspace.
- Task 6 is read-only. Consequential response actions will remain behind the
  approval workflow delivered in Task 8.

## Future live integrations

Future AWS integrations must be created through Terraform and should use
read-only collection roles for services such as CloudTrail, GuardDuty,
Security Hub, Config, and VPC Flow Logs. No chargeable collector is enabled by
default in this project.
