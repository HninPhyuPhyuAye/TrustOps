# Continuous integration pipeline

Every push to `main` and every pull request runs three least-privilege jobs with
read-only repository access.

## Application quality and security

1. Install exactly the versions in `package-lock.json`.
2. Run ESLint, TypeScript, and Vitest.
3. Fail on high or critical production dependency advisories.
4. Produce the standalone Next.js production build.

## Production container

BuildKit creates the multi-stage image without publishing it. The runner image
contains only the traced standalone server, static assets, and runtime files.
Trivy then fails the job for fixable high or critical operating-system or
library vulnerabilities.

## Terraform static validation

Terraform formatting, provider initialization with no backend, and static
validation run without AWS credentials. CI intentionally does not run `plan` or
`apply`. Dependabot separately proposes bounded npm, GitHub Actions, Docker, and
Terraform provider updates for human review.

## Branch protection recommendation

For a production repository, require all three jobs, one independent approval,
resolved review conversations, signed commits, and a linear history before
merging to `main`. Deployment should be a separate environment-protected
workflow using short-lived OIDC credentials—not long-lived AWS access keys.
