# Kubernetes Manifest Examples

## Contents

- Resources
- Probes
- Pod Disruption Budget
- Spreading replicas
- Horizontal Pod Autoscaler
- Helm chart layout and values
- Gateway API routing
- Security context

Adjust names, ports and numbers to the workload. Check API versions with `context7` for the cluster version in use.

## Resources

```yaml
resources:
  requests:    # Scheduler uses for placement
    memory: "256Mi"
    cpu: "100m"
  limits:      # Kubelet enforces these
    memory: "256Mi"   # memory request = limit
    # no CPU limit: avoids throttling
```

Memory is not compressible, so a container that exceeds its limit is killed. Setting the memory request equal to the memory limit keeps the scheduler's view of the node honest and avoids OOM kills caused by overcommitted nodes. A CPU limit is optional because it throttles the container even when the node has idle CPU.

## Probes

```yaml
livenessProbe:      # Restarts container if fails
  httpGet:
    path: /healthz
    port: 8080
  initialDelaySeconds: 15
  periodSeconds: 10
  failureThreshold: 3

readinessProbe:     # Removes from Service if fails
  httpGet:
    path: /ready
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 5
  failureThreshold: 3

startupProbe:       # Delays liveness until startup complete
  httpGet:
    path: /healthz
    port: 8080
  failureThreshold: 30
  periodSeconds: 10
```

## Pod Disruption Budget

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: api-pdb
spec:
  minAvailable: 2        # OR maxUnavailable: 1
  selector:
    matchLabels:
      app: api
```

## Spreading replicas

Prefer `topologySpreadConstraints` to spread replicas across zones and nodes. It gives even distribution, where anti-affinity only allows or forbids co-location.

```yaml
topologySpreadConstraints:
  - maxSkew: 1
    topologyKey: topology.kubernetes.io/zone
    whenUnsatisfiable: ScheduleAnyway   # DoNotSchedule for a hard requirement
    labelSelector:
      matchLabels:
        app: api
  - maxSkew: 1
    topologyKey: kubernetes.io/hostname
    whenUnsatisfiable: ScheduleAnyway
    labelSelector:
      matchLabels:
        app: api
```

Pod anti-affinity is still useful to keep two specific workloads apart:

```yaml
affinity:
  podAntiAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        podAffinityTerm:
          labelSelector:
            matchLabels:
              app: api
          topologyKey: kubernetes.io/hostname
```

## Horizontal Pod Autoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300  # Prevent flapping
```

## Helm chart layout and values

```
mychart/
├── Chart.yaml          # Chart metadata
├── values.yaml         # Default values
├── values-dev.yaml     # Environment overrides
├── values-prod.yaml
├── templates/
│   ├── _helpers.tpl    # Template helpers
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── hpa.yaml
│   ├── pdb.yaml
│   └── configmap.yaml
└── charts/             # Dependencies
```
```yaml
# values.yaml - use structured defaults
replicaCount: 2

image:
  repository: myapp
  tag: ""  # Override in CI, not here
  pullPolicy: IfNotPresent

resources:
  requests:
    memory: "256Mi"
    cpu: "100m"
  limits:
    memory: "512Mi"

# Enable/disable optional components
autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
```

## Gateway API routing

Gateway API replaces Ingress for new work. A platform team owns the `Gateway`, and application teams attach an `HTTPRoute` to it.

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: shared-gateway
  namespace: gateway-system
spec:
  gatewayClassName: <class provided by the installed controller>
  listeners:
    - name: https
      protocol: HTTPS
      port: 443
      hostname: api.example.com
      tls:
        mode: Terminate
        certificateRefs:
          - name: api-tls          # issued by cert-manager
      allowedRoutes:
        namespaces:
          from: Selector
          selector:
            matchLabels:
              gateway-access: "true"
---
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: api
spec:
  parentRefs:
    - name: shared-gateway
      namespace: gateway-system
  hostnames:
    - api.example.com
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /
      backendRefs:
        - name: api
          port: 80
```

## Security context

```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  runAsGroup: 1000
  fsGroup: 1000
  seccompProfile:
    type: RuntimeDefault

containers:
  - name: app
    securityContext:
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      capabilities:
        drop:
          - ALL
```
