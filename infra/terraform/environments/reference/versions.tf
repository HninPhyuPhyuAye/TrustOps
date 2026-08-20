terraform {
  required_version = ">= 1.9.0, < 2.0.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 6.0, < 7.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  # Allows a credential-free zero-resource plan while deployment is disabled.
  # These checks remain enabled for every real deployment.
  skip_credentials_validation = !var.deployment_enabled
  skip_metadata_api_check     = !var.deployment_enabled
  skip_requesting_account_id  = !var.deployment_enabled

  default_tags {
    tags = {
      Application = "TrustOps"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Repository  = "HninPhyuPhyuAye/TrustOps"
    }
  }
}
