# Security policy

## Supported scope

TrustOps is an architectural portfolio demonstration, not a production security
service. The `main` branch is the only supported version. Demonstration data is
synthetic and the application must not be connected to real customer, employee,
health, credential, or payment data.

## Reporting a vulnerability

Do not open a public issue for a suspected secret exposure, authentication
weakness, dependency vulnerability, or infrastructure misconfiguration. Use
GitHub's **Security > Report a vulnerability** private reporting flow for this
repository. Include the affected file or route, impact, reproduction steps, and
any suggested mitigation.

Do not include real credentials or personal information in a report.

## Delivery safeguards

- Pull requests run linting, type checking, tests, a production build, dependency
  auditing, Docker build validation, and Terraform validation.
- Runtime containers use an unprivileged user and drop Linux capabilities in the
  provided Compose profile.
- Terraform deployment is disabled by default and has no remote backend or AWS
  credentials configured in source.
- Environment files, Terraform state, plans, private keys, and generated output
  are excluded from version control.
- AI recommendations cannot execute without a policy-authorised human decision.
