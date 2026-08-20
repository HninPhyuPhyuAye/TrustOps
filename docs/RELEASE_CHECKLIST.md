# TrustOps release checklist

Local release validation completed on 20 August 2026. The final GitHub Actions
run is recorded after the release commit is pushed.

## Product workflow

- [x] Portfolio command centre renders across desktop and mobile viewports.
- [x] A reviewer can switch among all three isolated organisations.
- [x] SRE and SOC workspaces show tenant-scoped evidence.
- [x] Incident and AI workspaces show citations, uncertainty, and limitations.
- [x] Approval, rejection, simulation, verification, and reset flows work.
- [x] Audit export remains scoped to the selected workspace.

## Engineering gates

- [x] `npm run check`
- [x] `npm run build`
- [x] `npm audit --omit=dev --audit-level=high`
- [x] Production container health and hardening smoke test
- [x] High/critical container vulnerability scan
- [x] Terraform formatting, initialisation, and validation
- [x] Offline Terraform plan reports `SAFE_ZERO_RESOURCE_CONFIGURATION`
- [ ] GitHub Actions passes on the release commit

## Portfolio evidence

- [x] Desktop command-centre screenshot
- [x] Desktop AI investigation screenshot
- [x] Desktop approval-controlled automation screenshot
- [x] Mobile command-centre screenshot
- [x] README links to architecture, threat model, marketplace, and interview guide
- [x] Portfolio case study is ready to copy into the personal website

## Safety confirmation

- [x] Only synthetic data is visible.
- [x] No environment file, credential, state, plan, or generated secret is staged.
- [x] No AWS resource was created for this release.
- [x] The local release container is stopped after verification.
