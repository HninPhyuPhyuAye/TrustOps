# TrustOps approval-controlled automation

## Purpose

Task 8 demonstrates how TrustOps can turn an AI-assisted recommendation into a
governed operational workflow without giving an agent uncontrolled production
authority. Every action in the current application is local, deterministic,
simulated, and reversible through **Reset demo**.

No cloud, identity, endpoint, network, or customer system is connected.

## Control flow

```text
Incident evidence
  -> tenant-scoped runbook proposal
  -> actor and tenant policy evaluation
     -> blocked: no decision controls available
     -> allowed: human records approval or rejection + rationale
        -> rejected: execution remains blocked
        -> approved: simulation becomes available
           -> simulated execution
           -> runbook-specific verification
           -> separate audit event
```

## Role policy

| Role | Demonstration authority |
| --- | --- |
| Platform operator | Low and medium-risk actions for assigned tenants |
| Tenant administrator | Actions inside the assigned tenant, including high risk |
| SRE analyst | Restart and rollback actions for assigned tenants |
| SOC analyst | Disable-account, revoke-token, and block-address actions for assigned tenants |
| Auditor | Read-only access; decisions are blocked |

The policy engine returns both a machine-readable code and a human-readable
explanation. A role match alone is insufficient: the actor must also be in the
tenant scope, the request must still be pending, and high-risk actions require a
tenant administrator.

## Execution safety

- Every runbook has `requiresApproval: true`.
- Approval rationale is mandatory and becomes an audit event.
- Rejection permanently blocks the request in the current demonstration state.
- The execution engine only changes React demonstration state.
- Each action has deterministic verification text and checklist steps.
- A successful simulation creates a separate verification audit event.
- Resetting restores the immutable seeded fixtures.

## Audit trail

The audit workspace attributes tenant, actor, actor type, time, action, target,
outcome, and summary. A deterministic checksum links each visible event with the
previous event to illustrate append-only tamper evidence. This checksum is
explicitly a portfolio demonstration and not a production cryptographic ledger.

The visible, tenant-filtered event chain can be exported as JSON for interview
demonstrations.

## Production evolution

A production design would separate the policy decision point, execution worker,
credential broker, and audit store. Short-lived credentials, AWS KMS signing,
Step Functions, Systems Manager Automation, CloudTrail, and a write-once audit
archive are possible adapters. Those AWS resources will be represented only by
reviewed Terraform in Task 9 and will not be provisioned by default.
