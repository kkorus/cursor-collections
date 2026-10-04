# Content review: devops and AI-customization groups

Summary: 0 critical, 9 warning, 6 suggestion. `npm run check` passes (0 errors, 0 warnings). Every YAML/JSON snippet in the devops skills parses (checked with the `yaml` package); HCL snippets were only brace-checked because no terraform/tofu binary is installed. The D1 schema documented in `tsh-creating-skills`, `tsh-creating-agents` and `tsh-creating-commands` matches `scripts/lib/schema.mjs` (field names, enums, limits, command-only keys, `preload-skills` <= 2, name regex/64, description 1024). Rendering tables match `render-skills.mjs` and `render-agents.mjs`. No field is documented that the schema rejects, and none is omitted that it requires.

## Warnings

### W1. `tsh-creating-agents` promises that `shell: false` is stated in the body on Cursor and Codex, but the generator does not do it
- File: `src/skills/tsh-creating-agents/SKILL.md:90` ("Cursor and Codex have no shell switch, so `shell: false` is also stated in the body there").
- Evidence: `scripts/lib/render-agents.mjs` only uses `shell` for Claude (`deny.push('Bash')`, line 41). Nothing is added to the Cursor or Codex body. `.cursor/agents/tsh-ai-customization-researcher.md` and `.codex/agents/tsh-ai-customization-researcher.toml` contain no statement about shell. The source body of `src/agents/tsh-ai-customization-researcher.md` (shell: false, 10 agents use it) has none either.
- Failure scenario: an author or the reviewer agent trusts the sentence and assumes `shell: false` agents are restricted on Cursor and Codex. They are not restricted, and the body never tells them.
- Fix: either have the generator prepend a "Do not run shell commands" line for `shell: false` on Cursor and Codex, or change the sentence to tell authors to state the restriction in the body, as the next bullet does for `readonly`.

### W2. `tsh-creating-agents` and `tsh-creating-commands` define a "required" body structure that almost no artifact in the repo follows
- Files: `src/skills/tsh-creating-agents/SKILL.md:159,165-177`; `src/skills/tsh-creating-commands/SKILL.md:112-131`.
- Evidence (grep over `src/`):
  - `## Connected Skills` is marked "Yes" (required) and is in the validation checklist, but 0 of 17 agents have it.
  - `tsh-devops-engineer` has `## Persona` instead of the required `## Agent Role and Responsibilities`.
  - `tsh-ai-customization-researcher` and `tsh-ai-customization-reviewer` have no `## Skills Usage Guidelines`. The reviewer also has no `## Tool Usage Guidelines`.
  - Commands must have Route, Inputs, Required Skills, Steps, Output and Guardrails, and stay about 40 lines. Only the four `tsh-create-custom-*` commands do. `tsh-audit-infrastructure` has no Route, Inputs, Output or Guardrails. `tsh-analyze-cloud-costs` has no Route, Inputs or Output. `tsh-commit` is 125 lines (standalone, so arguably exempt).
- Failure scenario: the `tsh-ai-customization-reviewer` applies these checklists. Its own severity scale calls "missing required sections" must-fix, so reviewing any existing agent or command gives false must-fix findings, and `/tsh-create-custom-*` output will not match the existing collection. `lint.mjs` does not enforce any of it, so `npm run check` stays green.
- Fix: downgrade these rows to "recommended" (or drop `Connected Skills` for agents), or add the missing sections. Agents are leaves and carry little use for a `Connected Skills` list.

### W3. Cross-skill file references contradict rule D6 that the creating skills teach
- Files: `src/skills/tsh-delivering-infrastructure/SKILL.md:39,49`; `src/skills/tsh-implementing-ci-cd/SKILL.md:83`; `src/skills/tsh-analyze-cloud-costs/SKILL.md:16` (`references/aws-audit-checklist.md`, `references/gcp-audit-checklist.md`, `assets/cost-audit-report.template.md` belong to `tsh-optimizing-cloud-cost`); `src/skills/tsh-audit-infrastructure/SKILL.md:14` (`assets/infrastructure-audit-report.template.md` belongs to `tsh-delivering-infrastructure`).
- Evidence: `tsh-creating-skills/SKILL.md` says "No cross-skill file references. Load the other skill by name instead." Lint passes only because these are inline code, not Markdown links.
- Failure scenario: a delegated `tsh-devops-engineer` reads `references/ci-pipelines.md` relative to the skill it is currently working in. The path resolves to the wrong skill, or to nothing, on tools that do not announce the skill base directory.
- Fix: move the IaC checklist into `tsh-delivering-infrastructure` or `tsh-implementing-ci-cd`, or name the owning skill and tell the agent to read the file "from that skill". Keep one convention. Adding a lint rule for `(references|assets)/` paths next to a different skill name would catch the rest.

### W4. Kubernetes Helm values example violates the skill's own memory rule
- File: `src/skills/tsh-implementing-kubernetes/references/manifests.md:158-163`.
- Evidence: the values example has `requests.memory: "256Mi"` and `limits.memory: "512Mi"`. `SKILL.md` ("Set the memory request equal to the memory limit") and its checklist ("memory limit equal to the memory request") say otherwise, and the `## Resources` example in the same file follows the rule.
- Failure scenario: an agent copies the chart defaults, which the skill forbids, and reports the checklist as satisfied.
- Fix: set `limits.memory: "256Mi"` in the values example.

### W5. PDB example blocks node drains with the skill's own replica counts
- File: `src/skills/tsh-implementing-kubernetes/references/manifests.md:60-68`, with the HPA at lines 103-105 and `replicaCount: 2` in the values example.
- Evidence: `minAvailable: 2` on a Deployment with 2 replicas (HPA `minReplicas: 2`, `replicaCount: 2`) allows 0 disruptions. `kubectl drain` and cluster upgrades then hang. The skill says the PDB exists "to ensure availability during node drains".
- Fix: use `maxUnavailable: 1` as the default example, or `minAvailable: 1`. Note that `minAvailable` must be below the minimum replica count.

### W6. Terraform provider pin recommendations are stale and contradict the SKILL rule
- Files: `src/skills/tsh-implementing-terraform-modules/references/gcp-modules.md:81` (`google` `~> 5.0`), `aws-modules.md:62` (`~> 6.0`), `azure-modules.md:78` (`~> 4.0`), against `SKILL.md` best practice 2 ("never copy a version number from an old module; look up the current provider versions").
- Evidence: hashicorp/google 6.x shipped in 2024 and 7.x in 2025, so `~> 5.0` pins a provider two majors old. Uncertain: AWS `~> 6.0` and azurerm `~> 4.0` may also be behind by now. Verify against the registry.
- Fix: delete the hard-coded majors in the reference files and say "pin the current major from the registry", as `ci-pipelines.md` does for actions.

### W7. Azure reference recommends a resource that azurerm 4.x no longer has
- File: `src/skills/tsh-implementing-terraform-modules/references/azure-modules.md:82` ("Apply Azure Policy via Terraform (`azurerm_policy_assignment`)") in a file that says `~> 4.0`.
- Evidence: from my knowledge, `azurerm_policy_assignment` was deprecated in 3.x and removed in 4.0. The scoped resources are `azurerm_resource_group_policy_assignment`, `azurerm_subscription_policy_assignment`, `azurerm_management_group_policy_assignment` and `azurerm_resource_policy_assignment`. This is a high-confidence claim but I could not run the provider schema here.
- Fix: name the scoped resources.

### W8. Tag-set claim "the same five tags everywhere" is contradicted by the provider module references
- Files: `src/skills/tsh-implementing-terraform-modules/references/azure-modules.md:83` ("environment, cost-centre, managed-by"); `gcp-modules.md:85` ("env, team, cost-centre, managed-by"). Compare `src/skills/tsh-optimizing-cloud-cost/SKILL.md` ("The required set is the same five tags everywhere"): `CostCenter`, `Environment`, `Service`, `Owner`, `DataClass`, and on GCP `cost_center`, `environment`, `service`, `owner`, `data_class`.
- Failure scenario: a module built from the Azure or GCP reference uses `cost-centre`/`env`/`team` keys. The audits in `/tsh-analyze-cloud-costs` then report every resource as non-compliant with `tagging-standards.md`. GCP label keys also cannot contain the `cost-centre` form the audit expects (`cost_center`).
- Fix: point both lines to `tsh-optimizing-cloud-cost` (`tagging-standards.md`) instead of restating a different list.

### W9. `service-comparison.md` lists retired, closed or renamed services as current
- File: `src/skills/tsh-designing-multi-cloud-architecture/references/service-comparison.md` lines 46 (StorSimple), 62 (Azure Cognitive Search), 81 (AWS App Mesh), 120 (Cloud Source Repositories), 123 (GCP Deployment Manager), 133 (Cognitive Services).
- Evidence, from my knowledge and worth a quick recheck: StorSimple was retired in 2022. Deployment Manager end of support was announced for 31 Dec 2025 (Infrastructure Manager replaces it). AWS App Mesh end of support was announced for 30 Sep 2026. Cloud Source Repositories closed to new customers in 2024. Cognitive Search and Cognitive Services are now Azure AI Search and Azure AI services. `tsh-analyze-cloud-costs` still lists "Deployment Manager templates" as an IaC input, which is fine for legacy code but should not be the recommended tool.
- Failure scenario: a service-selection answer recommends a retired service as the Azure or GCP equivalent.
- Fix: update the rows (Infrastructure Manager, Azure AI Search, Azure AI services, drop StorSimple, mark App Mesh as retiring) or add a "verify with context7" note on the table.

## Suggestions

### S1. FOCUS column in the tagging standard looks wrong (uncertain)
- File: `src/skills/tsh-optimizing-cloud-cost/references/tagging-standards.md:29-36`.
- The "FOCUS mapping" names "Cost Center", "Environment" and "Resource Owner". As far as I know, FOCUS defines `ServiceName` and a `Tags` column, but no columns with those names. Either verify against the FOCUS spec or drop the column. It existed before the refactor and was carried over.

### S2. OpenTofu compatibility sentence is incomplete
- File: `src/skills/tsh-implementing-terraform-modules/SKILL.md` (OpenTofu section): "work with both, including `tofu test` and S3 `use_lockfile`".
- The test example uses `mock_provider`, which needs OpenTofu 1.8 or newer (my knowledge). Add the minimum. `use_lockfile` was experimental in Terraform 1.10 and GA in 1.11 (uncertain), while `ci-pipelines.md` says "1.10 or newer".

### S3. A read-only plan role conflicts with S3 lockfile state
- File: `src/skills/tsh-implementing-terraform-modules/references/ci-pipelines.md:59`.
- `terraform plan` takes the state lock by default. With `use_lockfile` the role needs `s3:PutObject` and `s3:DeleteObject` on the `.tflock` object. Mention this or `-lock=false`.

### S4. Observability examples are incomplete
- `src/skills/tsh-implementing-observability/SKILL.md:163` log example lacks `request_id`, which the Required Log Fields table lists. Line 91 `histogram_quantile(0.99, rate(..._bucket[5m]))` needs `sum by (le) (...)` to give a service-wide quantile.

### S5. Minor factual slips
- `src/skills/tsh-designing-multi-cloud-architecture/references/multi-cloud-patterns.md:135`: "Azure europewest" should be `westeurope`.
- `src/skills/tsh-creating-skills/SKILL.md:75-76` says Claude Code and Codex "read only this tree". The research doc says Codex also reads project `.codex/skills` and Claude also reads `~/.claude/skills`. Say "the install location of this toolkit".

### S6. `tsh-creating-skills` prefix rule for internal/orchestrator descriptions is not followed uniformly
- File: `src/skills/tsh-creating-skills/SKILL.md` ("start the description with 'Internal step of /tsh-...'"). `tsh-business-analyst` (orchestrator) does not. The rule is also unenforced by lint. Low impact.

## Verified without finding
- The schema, generator commands (`npm run generate`, `npm run check`), templates in `assets/`, per-tool output tables, `requires-mcp` to `compatibility`, Codex `agents/openai.yaml`, `disallowedTools` logic and the `preload-skills` rules all match the code.
- `tsh-creating-rules` matches the research document (Cursor `.mdc` fields, Claude `paths`, `@AGENTS.md` import, Codex concatenation, Cursor precedence Team > Project > User). Note the rules skill says "Claude Code reads CLAUDE.md, not AGENTS.md". The research doc says Claude 2.1.277 or newer reads AGENTS.md when no CLAUDE.md exists. The advice is still correct because the import is the safe pattern (spike Q8).
- GitLab `id_tokens:` (job JWT variables removed in 17.0), Bitbucket `oidc: true` and `BITBUCKET_STEP_OIDC_TOKEN`, GitHub `permissions: id-token: write` with `aws-actions/configure-aws-credentials` `role-to-assume`, Gateway API `Gateway`/`HTTPRoute` v1 fields, HPA `autoscaling/v2` with `behavior`, PDB `policy/v1`, Terraform `mock_provider` (1.7+) and `expect_failures`, `terragrunt run --all`, Trivy covering the former tfsec rules, and the 99.9%/30d = about 43 min error budget are all correct. The ingress-nginx retirement statement matches what I know (uncertain for the exact retirement date).
- Spot wording ("Spot VMs" on Azure and GCP, "up to 90%") is acceptable.
