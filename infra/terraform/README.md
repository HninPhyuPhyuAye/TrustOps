# Terraform reference environment

This directory models TrustOps on AWS without creating infrastructure by
default. It is designed for code review, interviews, CI validation, and a future
authorised deployment.

## Safe local validation

```bash
terraform fmt -check -recursive infra/terraform
terraform -chdir=infra/terraform/environments/reference init -backend=false
terraform -chdir=infra/terraform/environments/reference validate
```

The provider requires a credential-shaped value even for a zero-resource plan.
The following values are deliberately fake; provider validation, account lookup,
and metadata lookup are disabled only while `deployment_enabled=false`:

```bash
AWS_ACCESS_KEY_ID=offline-plan-only \
AWS_SECRET_ACCESS_KEY=offline-plan-only \
AWS_EC2_METADATA_DISABLED=true \
terraform -chdir=infra/terraform/environments/reference plan \
  -input=false -lock=false
```

Expected result:

```text
deployment_enabled = false
safety_status       = "SAFE_ZERO_RESOURCE_CONFIGURATION"
```

No AWS API or chargeable resource is required for these checks.

## Rules for a future deployment

1. Create an isolated AWS account and least-privilege deployment role.
2. Configure a remote encrypted Terraform backend with locking.
3. Copy `terraform.tfvars.example` outside version control.
4. Replace public ingress, ownership, cost allocation, image digest, and
   environment values.
5. Review current AWS pricing and the architecture gaps document.
6. Set both safety flags only in the reviewed private variables file.
7. Save and peer-review a plan before any separately authorised apply.

Do not commit a plan, state file, credentials, generated password, database
endpoint, or private variables file.
