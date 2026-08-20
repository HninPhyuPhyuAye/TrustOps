# Runbook: Terraform review without deployment

## Purpose

Prove that TrustOps infrastructure is reproducible while keeping AWS usage at
zero. This runbook never authorises `terraform apply`.

## Procedure

```bash
terraform fmt -check -recursive infra/terraform
terraform -chdir=infra/terraform/environments/reference init -backend=false
terraform -chdir=infra/terraform/environments/reference validate

AWS_ACCESS_KEY_ID=offline-plan-only \
AWS_SECRET_ACCESS_KEY=offline-plan-only \
AWS_EC2_METADATA_DISABLED=true \
terraform -chdir=infra/terraform/environments/reference plan \
  -input=false -lock=false
```

Verify that the plan contains no resources to add, change, or destroy and shows
`SAFE_ZERO_RESOURCE_CONFIGURATION`. The fake values are used only to satisfy
local provider initialization; the disabled provider skips AWS credential,
account, and metadata validation.

## Review checklist

- Safety flags remain false in committed configuration.
- No backend, account ID, access key, secret, state, plan, or private variables
  are committed.
- Region, availability zones, ingress, image digest, owners, and cost tags are
  explicit.
- IAM task permissions are empty until a real adapter requires defined access.
- RDS is private, encrypted, protected, backed up, and uses managed credentials.
- The enabled architecture cost is reviewed before any private plan is created.
