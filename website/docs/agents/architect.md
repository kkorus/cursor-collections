---
sidebar_position: 2
title: Architect
---

# Architect Agent

**Source:** `src/agents/tsh-architect.md`  
**Kind:** subagent, model tier `deep`, read-write access

The Architect agent designs technical solutions, system architecture, and detailed implementation plans. It translates business requirements into structured, executable specifications that are validated by the Plan Reviewer before implementation begins.

## Responsibilities

- Designing the overall architecture of the solution (components, interactions, data flow).
- Creating detailed implementation plans broken into phases and tasks with checklist-style tracking.
- Ensuring solutions align with project requirements, best practices, and quality standards.
- Defining security considerations and quality assurance guidelines.
- Collaborating with Business Analysts to clarify ambiguities.

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
