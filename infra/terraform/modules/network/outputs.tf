output "vpc_id" {
  description = "TrustOps VPC ID, or null while deployment is disabled."
  value       = try(aws_vpc.this[0].id, null)
}

output "public_subnet_ids" {
  description = "Internet-facing subnet IDs."
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private workload subnet IDs."
  value       = aws_subnet.private[*].id
}
