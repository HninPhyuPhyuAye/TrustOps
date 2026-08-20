output "alert_topic_arn" {
  description = "SNS topic for operational alarms."
  value       = try(aws_sns_topic.alerts[0].arn, null)
}

output "dashboard_name" {
  description = "CloudWatch dashboard name."
  value       = try(aws_cloudwatch_dashboard.operations[0].dashboard_name, null)
}
