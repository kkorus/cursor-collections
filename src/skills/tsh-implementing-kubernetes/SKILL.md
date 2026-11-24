---
name: tsh-implementing-kubernetes
description: Kubernetes deployment patterns, Helm charts, GitOps and cluster management. Use when deploying applications to Kubernetes, designing Deployment, StatefulSet, or Job configurations, implementing auto-scaling (HPA, VPA, KEDA), creating or modifying Helm charts, setting up Gateway API routing and GitOps, or configuring resource requests, limits, and QoS.
type: skill
metadata:
  short-description: Kubernetes deployments, Helm charts and scaling
---

# Kubernetes Patterns

## Project Detection

Check which Kubernetes tooling the project uses:
- `helm/` or `Chart.yaml` → Helm charts
- `kustomize/` or `kustomization.yaml` → Kustomize
- `k8s/` or `kubernetes/` with `*.yaml` → Raw manifests
- `skaffold.yaml` → Skaffold for local dev
- `argocd/` or `Application` resources → ArgoCD GitOps
- `flux-system/` or `Kustomization` CRD → Flux GitOps

Use `context7` to look up Kubernetes API versions and syntax.

## Workload Type Decision

| Workload Type | Use When |
|---------------|----------|
| **Deployment** | Stateless apps, web servers, APIs |
| **StatefulSet** | Databases, stateful apps needing stable identity |
| **DaemonSet** | Node-level agents (logging, monitoring) |
| **Job** | One-time tasks, batch processing |
| **CronJob** | Scheduled recurring tasks |

## Deployment Configuration

Manifest examples for everything below are in `references/manifests.md`.

### Resource Management

**Rules:**
- Always set requests (required for scheduling).
- Set the memory request equal to the memory limit. Memory is not compressible, and a container over its limit is killed.
- CPU limits are optional. They throttle the container even when the node has idle CPU. Always set a CPU request.
- Start from profiling or load tests. Use a VPA in recommendation mode to tune the numbers.

### QoS Classes

| Class | Condition | Eviction Priority |
|-------|-----------|-------------------|
| **Guaranteed** | requests == limits for CPU and memory (all containers) | Last to evict |
| **Burstable** | requests < limits | Medium |
| **BestEffort** | No requests or limits | First to evict |

**Rule:** Production workloads should be Guaranteed or Burstable, never BestEffort.

### Probes

**Rules:**
- Always configure a readinessProbe (graceful traffic handling).
- Use a startupProbe for slow-starting apps (instead of a long initialDelaySeconds).
- The livenessProbe should check app health, not dependencies.

### Pod Disruption Budget

**Rule:** Always create a PDB for production workloads to ensure availability during node drains.

### Spreading replicas

**Rule:** Spread replicas across zones and nodes with `topologySpreadConstraints` (example in `references/manifests.md`). Use pod anti-affinity only to keep specific workloads apart.

## Scaling Strategies

### Scaling Decision Matrix

| Scaling Type | Use When | Tool |
|--------------|----------|------|
| CPU-based | General compute workloads | HPA |
| Memory-based | Memory-intensive apps | HPA |
| Custom metrics | Queue depth, request rate | HPA + a metrics adapter (for example Prometheus Adapter) |
| Event-driven | Message queues, scheduled jobs | KEDA |
| Vertical | Right-sizing requests/limits | VPA |

**HPA and VPA conflict:** do not let an HPA and a VPA act on the same resource metric (CPU or memory) of the same workload. Both would react to the same signal and fight each other. Run the VPA in recommendation mode (`updateMode: "Off"`), or scale horizontally on CPU or custom metrics and vertically only on memory.

Set `behavior.scaleDown.stabilizationWindowSeconds` on the HPA to prevent flapping.

## Helm Chart Structure

Chart layout and a values example are in `references/manifests.md`.

**Rules:**
- Don't hardcode image tags in values.yaml (set them in CI).
- Use `{{ include "mychart.fullname" . }}` for resource names.
- Provide sensible defaults, override per environment (`values-dev.yaml`, `values-prod.yaml`).

## GitOps

This skill is the canonical owner of GitOps delivery (Argo CD, Flux). Keep desired state in Git, let the controller reconcile drift and enable automated sync with pruning only after the user agrees. Pipelines build and publish images and update the Git state. They do not run `kubectl apply` against production (see `tsh-implementing-ci-cd`).

## Traffic Routing

Use **Gateway API** (`Gateway` and `HTTPRoute`) for new routing. The community NGINX ingress controller is retired upstream, so do not choose it for new work. For existing Ingress resources, plan a migration to Gateway API. Pick a maintained controller that implements Gateway API.

| Controller type | Use When |
|-----------------|----------|
| **Cloud provider gateway** (managed load balancer integration) | Cloud-native, integrated with the provider's WAF and certificates |
| **Envoy-based gateway** | General purpose, self-managed, portable |
| **Service mesh gateway** (Istio, Cilium) | A service mesh is already in use |

Keep TLS certificates in cert-manager. An `HTTPRoute` example is in `references/manifests.md`. Adopting a service mesh is an architect decision.

## Security Context

Example in `references/manifests.md`.

**Rule:** Always run as non-root with minimal capabilities in production.

## Process

1. **Discover context** → Check existing K8s manifests, Helm charts, Kustomize
2. **Choose workload type** → Deployment, StatefulSet, Job based on requirements
3. **Configure resources** → Set requests/limits based on profiling or estimates
4. **Add probes** → Configure readiness, liveness, and startup probes
5. **Enable scaling** → Add HPA/KEDA based on scaling requirements
6. **Add resilience** → PDB, pod anti-affinity, topology spread
7. **Configure security** → Security context, network policies
8. **Validate** → `kubectl apply --dry-run=server`, helm template

## Checklist

- [ ] Resource requests defined, memory limit equal to the memory request
- [ ] Readiness and liveness probes configured
- [ ] PodDisruptionBudget created for production
- [ ] Pod anti-affinity or topology spread configured
- [ ] HPA configured for variable workloads (no HPA and VPA on the same metric)
- [ ] Security context with non-root user
- [ ] Image pull policy appropriate (Never use `latest` in prod)
- [ ] Labels consistent (`app`, `version`, `environment`)
- [ ] Namespace isolation per environment
- [ ] Routing uses Gateway API, not a retired ingress controller

## Anti-Patterns

| Don't | Do |
|-------|-----|
| Use `latest` image tag | Pin specific versions or SHA |
| Skip resource requests | Always set requests for scheduling |
| Single replica in production | Minimum 2 replicas with PDB |
| Run as root | Use non-root user with minimal caps |
| Missing readiness probe | Configure probes for graceful traffic |
| `kubectl apply` in production | GitOps with Argo CD/Flux |
| New routing on the retired NGINX ingress controller | Gateway API with a maintained controller |
| Hardcode values in manifests | Use Helm values or Kustomize overlays |
| Ignore pod eviction | Set PDB to maintain availability |

## Summary Output

End an implementation with the summary in `assets/deployment-summary.template.md`. Service architecture or topology design, a service mesh (Istio, Linkerd) and multi-cluster or multi-region deployments are architect decisions (see `tsh-delivering-infrastructure`). HPA and PDB configuration, probes, resource limits and manifest fixes are not. If the project instructions name no Technical Context for Kubernetes, say so in the summary.

## Connected Skills

- `tsh-implementing-observability` - For K8s monitoring and logging setup
- `tsh-implementing-ci-cd` - For K8s deployment pipelines
- `tsh-managing-secrets` - For K8s secret management patterns
- `tsh-implementing-terraform-modules` - For provisioning K8s clusters
