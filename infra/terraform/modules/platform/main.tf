locals {
  common_tags = merge(var.tags, {
    Component = "platform"
  })
  resolved_image = var.enabled ? var.container_image : "disabled"
}

resource "aws_ecr_repository" "app" {
  count = var.enabled ? 1 : 0

  name                 = var.name
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = local.common_tags
}

resource "aws_ecr_lifecycle_policy" "app" {
  count = var.enabled ? 1 : 0

  repository = aws_ecr_repository.app[0].name
  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Retain the most recent 20 application images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 20
      }
      action = { type = "expire" }
    }]
  })
}

resource "aws_cloudwatch_log_group" "app" {
  count = var.enabled ? 1 : 0

  name              = "/trustops/${var.environment}/application"
  retention_in_days = 30

  tags = local.common_tags
}

resource "aws_ecs_cluster" "this" {
  count = var.enabled ? 1 : 0

  name = var.name

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = local.common_tags
}

data "aws_iam_policy_document" "ecs_tasks_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "execution" {
  count = var.enabled ? 1 : 0

  name               = "${var.name}-execution"
  assume_role_policy = data.aws_iam_policy_document.ecs_tasks_assume_role.json
  tags               = local.common_tags
}

resource "aws_iam_role_policy_attachment" "execution" {
  count = var.enabled ? 1 : 0

  role       = aws_iam_role.execution[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "task" {
  count = var.enabled ? 1 : 0

  name               = "${var.name}-task"
  assume_role_policy = data.aws_iam_policy_document.ecs_tasks_assume_role.json
  tags               = local.common_tags
}

resource "aws_security_group" "alb" {
  count = var.enabled ? 1 : 0

  name        = "${var.name}-alb"
  description = "Internet traffic to the TrustOps load balancer"
  vpc_id      = var.vpc_id

  tags = merge(local.common_tags, { Name = "${var.name}-alb" })
}

resource "aws_vpc_security_group_ingress_rule" "alb_http" {
  count = var.enabled ? length(var.allowed_ingress_cidrs) : 0

  security_group_id = aws_security_group.alb[0].id
  cidr_ipv4         = var.allowed_ingress_cidrs[count.index]
  from_port         = 80
  to_port           = 80
  ip_protocol       = "tcp"
  description       = "HTTP reference listener"
}

resource "aws_security_group" "app" {
  count = var.enabled ? 1 : 0

  name        = "${var.name}-app"
  description = "Traffic to private TrustOps ECS tasks"
  vpc_id      = var.vpc_id

  tags = merge(local.common_tags, { Name = "${var.name}-app" })
}

resource "aws_vpc_security_group_ingress_rule" "app_from_alb" {
  count = var.enabled ? 1 : 0

  security_group_id            = aws_security_group.app[0].id
  referenced_security_group_id = aws_security_group.alb[0].id
  from_port                    = var.container_port
  to_port                      = var.container_port
  ip_protocol                  = "tcp"
  description                  = "Application traffic from the ALB"
}

resource "aws_vpc_security_group_egress_rule" "alb_to_app" {
  count = var.enabled ? 1 : 0

  security_group_id            = aws_security_group.alb[0].id
  referenced_security_group_id = aws_security_group.app[0].id
  from_port                    = var.container_port
  to_port                      = var.container_port
  ip_protocol                  = "tcp"
  description                  = "ALB traffic to application tasks"
}

resource "aws_vpc_security_group_egress_rule" "app_outbound" {
  count = var.enabled ? 1 : 0

  security_group_id = aws_security_group.app[0].id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
  description       = "Application egress through the private NAT route"
}

resource "aws_security_group" "database" {
  count = var.enabled ? 1 : 0

  name        = "${var.name}-database"
  description = "PostgreSQL access from TrustOps ECS tasks"
  vpc_id      = var.vpc_id

  tags = merge(local.common_tags, { Name = "${var.name}-database" })
}

resource "aws_vpc_security_group_ingress_rule" "database_from_app" {
  count = var.enabled ? 1 : 0

  security_group_id            = aws_security_group.database[0].id
  referenced_security_group_id = aws_security_group.app[0].id
  from_port                    = 5432
  to_port                      = 5432
  ip_protocol                  = "tcp"
  description                  = "PostgreSQL from application tasks"
}

resource "aws_lb" "app" {
  count = var.enabled ? 1 : 0

  name               = substr("${var.name}-alb", 0, 32)
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb[0].id]
  subnets            = var.public_subnet_ids

  enable_deletion_protection = true
  drop_invalid_header_fields = true

  tags = local.common_tags
}

resource "aws_lb_target_group" "app" {
  count = var.enabled ? 1 : 0

  name        = substr("${var.name}-app", 0, 32)
  port        = var.container_port
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = var.vpc_id

  deregistration_delay = 30

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/api/health"
    timeout             = 5
    unhealthy_threshold = 3
  }

  tags = local.common_tags
}

resource "aws_lb_listener" "http" {
  count = var.enabled ? 1 : 0

  load_balancer_arn = aws_lb.app[0].arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app[0].arn
  }

  tags = local.common_tags
}

resource "aws_ecs_task_definition" "app" {
  count = var.enabled ? 1 : 0

  family                   = var.name
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = aws_iam_role.execution[0].arn
  task_role_arn            = aws_iam_role.task[0].arn

  runtime_platform {
    cpu_architecture        = "X86_64"
    operating_system_family = "LINUX"
  }

  container_definitions = jsonencode([{
    name      = "trustops"
    image     = local.resolved_image
    essential = true
    portMappings = [{
      containerPort = var.container_port
      hostPort      = var.container_port
      protocol      = "tcp"
    }]
    environment = [{
      name  = "TRUSTOPS_DEPLOYMENT_ENV"
      value = var.environment
    }]
    readonlyRootFilesystem = true
    user                   = "1001"
    linuxParameters = {
      initProcessEnabled = true
      capabilities = {
        drop = ["ALL"]
      }
    }
    healthCheck = {
      command = [
        "CMD-SHELL",
        "node -e \"fetch('http://127.0.0.1:${var.container_port}/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))\"",
      ]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 10
    }
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = aws_cloudwatch_log_group.app[0].name
        awslogs-region        = data.aws_region.current.region
        awslogs-stream-prefix = "trustops"
      }
    }
  }])

  tags = local.common_tags
}

data "aws_region" "current" {}

resource "aws_ecs_service" "app" {
  count = var.enabled ? 1 : 0

  name            = var.name
  cluster         = aws_ecs_cluster.this[0].id
  task_definition = aws_ecs_task_definition.app[0].arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  enable_execute_command = true

  network_configuration {
    assign_public_ip = false
    security_groups  = [aws_security_group.app[0].id]
    subnets          = var.private_subnet_ids
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app[0].arn
    container_name   = "trustops"
    container_port   = var.container_port
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  depends_on = [
    aws_iam_role_policy_attachment.execution,
    aws_lb_listener.http,
  ]

  tags = local.common_tags
}

resource "aws_appautoscaling_target" "ecs" {
  count = var.enabled ? 1 : 0

  max_capacity       = var.maximum_count
  min_capacity       = var.minimum_count
  resource_id        = "service/${aws_ecs_cluster.this[0].name}/${aws_ecs_service.app[0].name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "ecs_cpu" {
  count = var.enabled ? 1 : 0

  name               = "${var.name}-cpu"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs[0].resource_id
  scalable_dimension = aws_appautoscaling_target.ecs[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs[0].service_namespace

  target_tracking_scaling_policy_configuration {
    target_value = 60

    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
  }
}

resource "aws_db_subnet_group" "this" {
  count = var.enabled ? 1 : 0

  name       = var.name
  subnet_ids = var.private_subnet_ids
  tags       = local.common_tags
}

resource "aws_db_instance" "postgres" {
  count = var.enabled ? 1 : 0

  identifier                  = "${var.name}-postgres"
  engine                      = "postgres"
  instance_class              = var.database_instance_class
  allocated_storage           = 20
  max_allocated_storage       = 100
  storage_type                = "gp3"
  storage_encrypted           = true
  db_name                     = "trustops"
  username                    = "trustops_admin"
  manage_master_user_password = true
  port                        = 5432
  multi_az                    = var.database_multi_az
  publicly_accessible         = false
  db_subnet_group_name        = aws_db_subnet_group.this[0].name
  vpc_security_group_ids      = [aws_security_group.database[0].id]

  backup_retention_period   = 7
  copy_tags_to_snapshot     = true
  deletion_protection       = true
  skip_final_snapshot       = false
  final_snapshot_identifier = "${var.name}-final"

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  tags = local.common_tags
}
