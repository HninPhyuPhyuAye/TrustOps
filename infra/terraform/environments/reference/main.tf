locals {
  name = "trustops-${var.environment}"
}

check "deployment_cost_acknowledged" {
  assert {
    condition     = !var.deployment_enabled || var.cost_acknowledged
    error_message = "Set cost_acknowledged=true only after reviewing the plan and AWS pricing."
  }
}

check "immutable_container_image" {
  assert {
    condition = !var.deployment_enabled || (
      var.container_image != "" && strcontains(var.container_image, "@sha256:")
    )
    error_message = "An enabled deployment requires an immutable container_image digest."
  }
}

module "network" {
  source = "../../modules/network"

  enabled            = var.deployment_enabled
  name               = local.name
  availability_zones = var.availability_zones
  tags               = var.additional_tags
}

module "platform" {
  source = "../../modules/platform"

  enabled               = var.deployment_enabled
  name                  = local.name
  environment           = var.environment
  vpc_id                = module.network.vpc_id
  public_subnet_ids     = module.network.public_subnet_ids
  private_subnet_ids    = module.network.private_subnet_ids
  container_image       = var.container_image
  allowed_ingress_cidrs = var.allowed_ingress_cidrs
  database_multi_az     = var.database_multi_az
  tags                  = var.additional_tags
}

module "monitoring" {
  source = "../../modules/monitoring"

  enabled                  = var.deployment_enabled
  name                     = local.name
  aws_region               = var.aws_region
  ecs_cluster_name         = module.platform.ecs_cluster_name
  ecs_service_name         = module.platform.ecs_service_name
  load_balancer_arn_suffix = module.platform.load_balancer_arn_suffix
  database_identifier      = module.platform.database_identifier
  tags                     = var.additional_tags
}
