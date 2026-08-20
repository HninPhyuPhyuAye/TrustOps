output "application_url" {
  description = "HTTP reference URL, or null while deployment is disabled."
  value       = try("http://${aws_lb.app[0].dns_name}", null)
}

output "load_balancer_arn_suffix" {
  description = "ALB ARN suffix used by CloudWatch metrics."
  value       = try(aws_lb.app[0].arn_suffix, null)
}

output "ecs_cluster_name" {
  description = "ECS cluster name."
  value       = try(aws_ecs_cluster.this[0].name, null)
}

output "ecs_service_name" {
  description = "ECS service name."
  value       = try(aws_ecs_service.app[0].name, null)
}

output "ecr_repository_url" {
  description = "Private container repository URL."
  value       = try(aws_ecr_repository.app[0].repository_url, null)
}

output "database_identifier" {
  description = "RDS database identifier used by CloudWatch metrics."
  value       = try(aws_db_instance.postgres[0].identifier, null)
}

output "database_endpoint" {
  description = "Private RDS endpoint."
  value       = try(aws_db_instance.postgres[0].endpoint, null)
  sensitive   = true
}
