# AWS Audit Checklist

Use this checklist for a full AWS cost and tagging audit. Check every category unless the user narrowed the scope. Use read-only API operations (`describe`, `list`, `get`).

## Resource categories

- **Compute**: EC2 instances (sizing, generation, purchase type), Auto Scaling groups (min/max/desired), Lambda functions (memory, timeout, concurrency), ECS/EKS tasks and services, Batch compute environments.
- **Storage**: EBS volumes (type, size, IOPS, attachment status), S3 buckets (lifecycle policies, storage class, versioning, access patterns), EFS file systems (throughput mode, storage class).
- **Databases**: RDS instances (engine, class, Multi-AZ, storage type), Aurora clusters (instance count, Serverless v2 scaling), DynamoDB tables (capacity mode, provisioned throughput vs on-demand), ElastiCache clusters (node type, cluster mode).
- **Networking**: NAT Gateways (data transfer costs), VPC endpoints (vs NAT Gateway savings), Elastic IPs (unattached), load balancers (idle or underutilized), CloudFront distributions (price class, caching efficiency), Route 53 hosted zones.
- **Containers and orchestration**: ECS Fargate tasks (CPU/memory allocation), EKS node groups (instance types, scaling), ECR repositories (lifecycle policies, image count).
- **Serverless**: Lambda (invocation count, duration, provisioned concurrency), API Gateway (endpoint type, caching), Step Functions (execution count, Express vs Standard).
- **AI/ML**: SageMaker endpoints (instance type, auto scaling), Bedrock usage, GPU instances.
- **Security and compliance**: security groups (overly permissive rules), KMS keys (unused), WAF rules, Certificate Manager certificates.
- **Other**: CloudWatch Logs (retention policies), SNS/SQS (unused topics and queues), Secrets Manager (unused secrets), data transfer costs (cross-AZ, cross-region, internet egress).

## Data sources

- **Inventory and tags**: the AWS API MCP server (read-only operations).
- **Actual cost data**: Cost Explorer (`ce:GetCostAndUsage`). If it is unavailable, estimate from instance type and runtime hours and say so in the report.
- **Current instance families, pricing tiers and regional availability**: the AWS documentation MCP server. Check it before you recommend any instance type or configuration.
- **Terraform provider documentation**: `context7`.
- **Fallback**: if the API server is unavailable, use the documentation server and `context7`, tell the user the audit is based on documentation and not on live data, and recommend a re-run with API access.

## Tag checks

- Every resource carries the required tag set from `tagging-standards.md`.
- GPU instances and SageMaker endpoints carry the AI/ML tags.
- Storage and database resources carry the data classification tag.
- Development resources that run 24/7 carry a schedule tag.
