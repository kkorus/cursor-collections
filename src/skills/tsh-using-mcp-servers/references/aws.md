# AWS servers

`awslabs.aws-api-mcp-server` runs AWS API operations. `awslabs.aws-documentation-mcp-server` searches and reads AWS documentation.

## When to use

- Inspecting the live state of AWS resources, costs, tags and configuration (API server).
- Verifying service behavior, limits, pricing model details and current best practices (documentation server).

## How to use

1. **Know the target.** Confirm the AWS profile and region with the user or the task before the first call. Never guess an account.
2. **Read before you change.** Start with describe, list and get operations. Do not run create, modify or delete operations unless the task explicitly asks for them and the user approved.
3. **Keep queries scoped.** Filter by region, tag or resource type. Broad listings are slow and noisy.
4. **Check the documentation for the current behavior** of a service or API before you rely on memory, and cite the page you used.
5. **Infrastructure as code wins.** When the project defines the resource in Terraform or similar, change the code, not the live resource.

## When blocked

Missing credentials, an expired session or insufficient permissions: report the error and what access is needed. Do not try to work around permissions.
