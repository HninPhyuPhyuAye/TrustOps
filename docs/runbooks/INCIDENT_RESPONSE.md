# Runbook: TrustOps incident response workflow

## Trigger

Use this workflow when a reliability alert, security detection, or correlated
incident affects a demonstration tenant.

## Procedure

1. Confirm the selected tenant and incident identity before interpreting data.
2. Review SRE golden signals, SLO burn, deployment changes, logs, and traces.
3. Review SOC identity, vulnerability, drift, and attack evidence.
4. Open the unified incident timeline and distinguish facts, hypotheses,
   counter-evidence, confidence, and unknowns.
5. Record business impact and draft stakeholder communication without claiming
   recovery prematurely.
6. Select the retrieved runbook and inspect risk, scope, and verification steps.
7. Change demonstration actor to prove tenant and role policy enforcement.
8. Have an authorised human approve or reject with a specific rationale.
9. Run only the local simulation, observe each recovery check, and confirm a
   separate verification event appears.
10. Export the audit JSON when evidence is required for the interview walkthrough.

## Safety rules

- AI output is advisory and must cite the evidence shown in the interface.
- Do not execute commands against real accounts, endpoints, users, or services.
- A successful runbook step is not recovery until its verification passes.
- Preserve rejected decisions and failed outcomes; never rewrite audit history.
- Escalate uncertainty instead of inventing a root cause.
