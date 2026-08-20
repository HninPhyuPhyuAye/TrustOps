locals {
  common_tags = merge(var.tags, {
    Component = "monitoring"
  })
}

resource "aws_sns_topic" "alerts" {
  count = var.enabled ? 1 : 0

  name              = "${var.name}-alerts"
  kms_master_key_id = "alias/aws/sns"
  tags              = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "ecs_cpu" {
  count = var.enabled ? 1 : 0

  alarm_name          = "${var.name}-ecs-high-cpu"
  alarm_description   = "TrustOps ECS CPU exceeded the operating threshold."
  namespace           = "AWS/ECS"
  metric_name         = "CPUUtilization"
  statistic           = "Average"
  period              = 300
  evaluation_periods  = 2
  threshold           = 80
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.alerts[0].arn]

  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = var.ecs_service_name
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "alb_errors" {
  count = var.enabled ? 1 : 0

  alarm_name          = "${var.name}-alb-5xx"
  alarm_description   = "The TrustOps load balancer returned repeated 5xx responses."
  namespace           = "AWS/ApplicationELB"
  metric_name         = "HTTPCode_ELB_5XX_Count"
  statistic           = "Sum"
  period              = 300
  evaluation_periods  = 1
  threshold           = 5
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.alerts[0].arn]

  dimensions = {
    LoadBalancer = var.load_balancer_arn_suffix
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "database_cpu" {
  count = var.enabled ? 1 : 0

  alarm_name          = "${var.name}-database-high-cpu"
  alarm_description   = "TrustOps PostgreSQL CPU exceeded the operating threshold."
  namespace           = "AWS/RDS"
  metric_name         = "CPUUtilization"
  statistic           = "Average"
  period              = 300
  evaluation_periods  = 2
  threshold           = 80
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.alerts[0].arn]

  dimensions = {
    DBInstanceIdentifier = var.database_identifier
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_dashboard" "operations" {
  count = var.enabled ? 1 : 0

  dashboard_name = "${var.name}-operations"
  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 8
        height = 6
        properties = {
          title  = "ECS CPU and memory"
          region = var.aws_region
          stat   = "Average"
          period = 300
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ClusterName", var.ecs_cluster_name, "ServiceName", var.ecs_service_name],
            [".", "MemoryUtilization", ".", ".", ".", "."],
          ]
        }
      },
      {
        type   = "metric"
        x      = 8
        y      = 0
        width  = 8
        height = 6
        properties = {
          title  = "Load balancer responses"
          region = var.aws_region
          stat   = "Sum"
          period = 300
          metrics = [
            ["AWS/ApplicationELB", "HTTPCode_ELB_5XX_Count", "LoadBalancer", var.load_balancer_arn_suffix],
            [".", "RequestCount", ".", "."],
          ]
        }
      },
      {
        type   = "metric"
        x      = 16
        y      = 0
        width  = 8
        height = 6
        properties = {
          title  = "PostgreSQL CPU and connections"
          region = var.aws_region
          stat   = "Average"
          period = 300
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", var.database_identifier],
            [".", "DatabaseConnections", ".", "."],
          ]
        }
      },
    ]
  })
}
