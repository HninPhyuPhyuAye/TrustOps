# Runbook: controlled teardown

## Local demonstration

```bash
docker compose down
```

Stop any remaining `npm run dev` process. No local database or persistent volume
is created by this repository.

## Future AWS environment

Only use these steps for infrastructure that was created from this Terraform
configuration and after written owner approval.

1. Export required audit evidence and confirm retention obligations.
2. Stop deployments and record the current ECS task definition and image digest.
3. Confirm RDS backups and create a uniquely named final snapshot.
4. In a reviewed change, disable ALB and RDS deletion protection.
5. Produce a destroy plan and inventory every proposed deletion.
6. Obtain a second approval before applying the saved destroy plan.
7. Confirm ECS, ALB, NAT gateway, RDS, ECR images, CloudWatch logs, alarms, SNS,
   and elastic IPs are removed or deliberately retained.
8. Check AWS Cost Explorer and resource tagging reports after billing data settles.
9. Remove temporary deployment permissions and archive the final evidence.

Do not manually delete a subset first unless Terraform state recovery and the
impact have been reviewed. An incomplete teardown can leave chargeable NAT,
load-balancer, database, snapshot, log, or address resources behind.
