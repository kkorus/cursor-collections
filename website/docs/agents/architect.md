---
sidebar_position: 2
title: Architect
---

# Architect Agent

**Source:** `src/agents/tsh-architect.md`  
**Kind:** subagent, model tier `deep`, read-write access

The Architect agent designs technical solutions, system architecture, and detailed implementation plans. It translates business requirements into structured, executable specifications. The Engineering Manager has the plan reviewed by the Plan Reviewer and asks you for approval before implementation begins; the Architect itself never asks you to approve.

## Responsibilities

- Designing the overall architecture of the solution (components, interactions, data flow).
- Creating detailed implementation plans broken into phases and tasks with checklist-style tracking.
- Ensuring solutions align with project requirements, best practices, and quality standards.
- Defining security considerations and quality assurance guidelines.
- Collaborating with Business Analysts to clarify ambiguities.
- Running a pre-submission self-check of the plan against the six BLOCKER categories of the plan review before handing it back.
- Keeping the `## Human Approval` record of the plan: it writes the record only for the delegated `TASK: record_human_approval`, which carries your verbatim answer, and bumps `Plan Revision` and resets the record to `PENDING` when a revision is material.

## Human approval

The Architect never asks you to approve a plan, in any mode. The approval gate (approve, comment or stop) belongs to the Engineering Manager and opens after the plan review loop settles. The manager then sends the Architect a delegated `TASK: record_human_approval` with your verbatim answer, and the Architect records it in the `## Human Approval` table of the plan (`Human Decision`, `Approved Revision`, `Decision Timestamp`, `Plan Revision`). When a legacy plan has no such section, the Architect creates it as `PENDING` and then records the decision.

When you run the Architect directly (for example with `claude --agent tsh-architect`, or by asking for the Architect subagent in Cursor), it only reports that approval is pending and points you to `/tsh-implement`, which runs the gate. The plan lives in `specifications/<task-name-or-id>/`.

## What It Produces

Each technical specification includes:

1. **Solution Architecture** — High-level overview of components, interactions, and data flow.
2. **Implementation Plan** — Phases and tasks with clear definition of done for each task, ready for Plan Reviewer validation.
3. **Test Plan** — Automated testing strategies (no manual QA steps).
4. **Security Considerations** — Security aspects to address during implementation.
5. **Quality Assurance** — Guidelines for ensuring implementation quality.

## Tool access

- **Read-write.**
- **Leaf agent.** It never delegates to other agents.
- **MCP servers:** Atlassian, Context7, Figma, PDF Reader, Sequential Thinking.

## Skills loaded

- `tsh-designing-architecture` (preloaded) - Design the architecture and implementation plan for a task
- `tsh-analyzing-codebase` - Analyze a codebase: dependencies, business logic, duplications
- `tsh-analyzing-implementation-gaps` - Compare a plan with the current state to find implementation gaps
- `tsh-discovering-technical-context` - Discover project conventions and patterns before coding
- `tsh-designing-databases` - SQL and database design: schemas, indexing, queries, ORMs
- `tsh-designing-multi-cloud-architecture` - Choose and integrate services across AWS, Azure and GCP
- `tsh-optimizing-cloud-cost` - Cloud cost rightsizing, tagging and governance
- `tsh-implementing-ci-cd` - CI/CD pipeline design and deployment strategies
- `tsh-implementing-terraform-modules` - Reusable Terraform modules for AWS, Azure and GCP
- `tsh-managing-secrets` - Secrets storage, rotation and CI/CD authentication
- `tsh-implementing-kubernetes` - Kubernetes deployments, Helm charts and scaling
- `tsh-implementing-observability` - Logging, monitoring, alerting and tracing patterns
- `tsh-engineering-prompts` - LLM prompt patterns: structure, security, evaluation
- `tsh-using-mcp-servers` - When and how to use the collection's MCP servers

## Invocation and modes

- **Delegated by:** `/tsh-ask` and `/tsh-audit-codebase` (commands running in the main thread) and the `tsh-engineering-manager` (planning and plan revisions). In delegated mode the task starts with `MODE: delegated` and the agent ends its reply with a `STATUS` block instead of asking the user.
- **Direct use:** the agent runs in interactive mode and talks to you. See the invocation table in the [Agents overview](./overview#invoking-an-agent-directly).

## Suggested next steps

The agent recommends these commands as text; it never starts them itself.

- `/tsh-implement Implement feature according to the plan` to start implementation.
- `/tsh-implement Implement the infrastructure according to the architectural plan` for infrastructure work; the engineering manager routes those tasks to the DevOps engineer.
