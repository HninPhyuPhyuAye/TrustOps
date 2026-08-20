variable "deployment_enabled" {
  description = "Global safety switch. False produces a zero-resource plan."
  type        = bool
  default     = false
}

variable "cost_acknowledged" {
  description = "Must also be true before enabling infrastructure that can incur AWS charges."
  type        = bool
  default     = false
}

variable "aws_region" {
  description = "AWS region for the reviewed reference architecture."
  type        = string
  default     = "ap-southeast-1"
}

variable "environment" {
  description = "Environment name used in resource names and tags."
  type        = string
  default     = "reference"
}

variable "availability_zones" {
  description = "Two availability zones used by the network module."
  type        = list(string)
  default     = ["ap-southeast-1a", "ap-southeast-1b"]
}

variable "container_image" {
  description = "Immutable image URI. Enabled deployments require an @sha256 digest."
  type        = string
  default     = ""
}

variable "allowed_ingress_cidrs" {
  description = "HTTP client CIDRs. Narrow this before enabling a real environment."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "database_multi_az" {
  description = "Creates an RDS standby when deployment is explicitly enabled."
  type        = bool
  default     = true
}

variable "additional_tags" {
  description = "Optional business ownership and cost allocation tags."
  type        = map(string)
  default = {
    CostCentre = "portfolio-reference"
    DataClass  = "synthetic-only"
  }
}
