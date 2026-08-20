variable "enabled" {
  description = "Creates application resources only when explicitly enabled."
  type        = bool
  default     = false
}

variable "name" {
  description = "Name prefix for TrustOps resources."
  type        = string
}

variable "environment" {
  description = "Deployment environment label."
  type        = string
}

variable "vpc_id" {
  description = "VPC supplied by the network module."
  type        = string
  default     = null
  nullable    = true
}

variable "public_subnet_ids" {
  description = "Public subnets for the application load balancer."
  type        = list(string)
  default     = []
}

variable "private_subnet_ids" {
  description = "Private subnets for ECS tasks and RDS."
  type        = list(string)
  default     = []
}

variable "container_image" {
  description = "Immutable ECR image URI supplied by the reviewed environment."
  type        = string
  default     = ""
}

variable "container_port" {
  description = "Port exposed by the TrustOps container."
  type        = number
  default     = 3000
}

variable "allowed_ingress_cidrs" {
  description = "CIDRs allowed to reach the HTTP listener. Replace the default before production use."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "desired_count" {
  description = "Normal ECS task count."
  type        = number
  default     = 2
}

variable "minimum_count" {
  description = "Minimum ECS autoscaling task count."
  type        = number
  default     = 2
}

variable "maximum_count" {
  description = "Maximum ECS autoscaling task count."
  type        = number
  default     = 6
}

variable "database_instance_class" {
  description = "RDS instance class used by a real enabled deployment."
  type        = string
  default     = "db.t4g.micro"
}

variable "database_multi_az" {
  description = "Enables an RDS standby in a second availability zone."
  type        = bool
  default     = true
}

variable "tags" {
  description = "Additional tags applied to resources."
  type        = map(string)
  default     = {}
}
