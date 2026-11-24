# GCP servers

`gcp-gcloud` runs gcloud commands, `gcp-observability` reads logs, metrics and traces, `gcp-storage` works with Cloud Storage buckets and objects.

## When to use

- Inspecting the live state of GCP projects, resources, labels and configuration (`gcp-gcloud`).
- Investigating errors, latency and resource usage (`gcp-observability`).
- Inspecting buckets, objects, lifecycle rules and storage classes (`gcp-storage`).

## How to use

1. **Know the target.** Confirm the project and region with the user or the task before the first call. Never guess a project.
2. **Read before you change.** Use list, describe and get commands. Do not run create, update or delete commands unless the task explicitly asks for them and the user approved.
3. **Keep queries scoped.** Filter logs and metrics by time range, resource and severity. Unbounded queries are slow and expensive.
4. **Infrastructure as code wins.** When the project defines the resource in Terraform or similar, change the code, not the live resource.
5. **Never print secrets.** Do not read or echo secret values, keys or tokens returned by a command.

## When blocked

Missing authentication, an unset project or insufficient permissions: report the error and what access is needed. Do not try to work around permissions.
