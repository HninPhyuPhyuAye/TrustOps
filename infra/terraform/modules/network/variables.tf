variable "enabled" {
  description = "Creates network resources only when explicitly enabled."
  type        = bool
  default     = false
}

variable "name" {
  description = "Name prefix for TrustOps resources."
  type        = string
}

variable "vpc_cidr" {
  description = "IPv4 CIDR for the TrustOps VPC."
  type        = string
  default     = "10.42.0.0/16"
}

variable "availability_zones" {
  description = "Two availability zones used by public and private subnets."
  type        = list(string)

  validation {
    condition     = length(var.availability_zones) == 2
    error_message = "Exactly two availability zones are required."
  }
}

variable "public_subnet_cidrs" {
  description = "CIDRs for the internet-facing load-balancer subnets."
  type        = list(string)
  default     = ["10.42.0.0/24", "10.42.1.0/24"]

  validation {
    condition     = length(var.public_subnet_cidrs) == 2
    error_message = "Exactly two public subnet CIDRs are required."
  }
}

variable "private_subnet_cidrs" {
  description = "CIDRs for ECS and RDS workloads."
  type        = list(string)
  default     = ["10.42.10.0/24", "10.42.11.0/24"]

  validation {
    condition     = length(var.private_subnet_cidrs) == 2
    error_message = "Exactly two private subnet CIDRs are required."
  }
}

variable "tags" {
  description = "Additional tags applied to resources."
  type        = map(string)
  default     = {}
}
