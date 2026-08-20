variable "enabled" {
  description = "Creates monitoring resources only when explicitly enabled."
  type        = bool
  default     = false
}

variable "name" {
  description = "Name prefix for TrustOps resources."
  type        = string
}

variable "aws_region" {
  description = "Region used in dashboard metric widgets."
  type        = string
}

variable "ecs_cluster_name" {
  description = "ECS cluster dimension."
  type        = string
  default     = null
  nullable    = true
}

variable "ecs_service_name" {
  description = "ECS service dimension."
  type        = string
  default     = null
  nullable    = true
}

variable "load_balancer_arn_suffix" {
  description = "Application Load Balancer metric dimension."
  type        = string
  default     = null
  nullable    = true
}

variable "database_identifier" {
  description = "RDS database metric dimension."
  type        = string
  default     = null
  nullable    = true
}

variable "tags" {
  description = "Additional tags applied to resources."
  type        = map(string)
  default     = {}
}
