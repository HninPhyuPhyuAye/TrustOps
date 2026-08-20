output "deployment_enabled" {
  description = "Confirms whether resource creation was explicitly enabled."
  value       = var.deployment_enabled
}

output "safety_status" {
  description = "Human-readable deployment guard state."
  value = var.deployment_enabled ? (
    var.cost_acknowledged ? "ENABLED_AFTER_COST_ACKNOWLEDGEMENT" : "BLOCKED"
  ) : "SAFE_ZERO_RESOURCE_CONFIGURATION"
}

output "application_url" {
  description = "Reference application endpoint after an enabled deployment."
  value       = module.platform.application_url
}

output "ecr_repository_url" {
  description = "Reference private container repository."
  value       = module.platform.ecr_repository_url
}

output "database_endpoint" {
  description = "Private database endpoint after an enabled deployment."
  value       = module.platform.database_endpoint
  sensitive   = true
}

output "cloudwatch_dashboard" {
  description = "Reference CloudWatch dashboard name."
  value       = module.monitoring.dashboard_name
}
