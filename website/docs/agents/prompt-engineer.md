---
sidebar_position: 14
title: Prompt Engineer
---

# Prompt Engineer Agent

**Source:** `src/agents/tsh-prompt-engineer.md`  
**Kind:** subagent, model tier `deep`, read-write access

The Prompt Engineer agent designs, writes, optimizes, and secures LLM application prompts — system prompts, user prompt templates, RAG context injection templates, agent tool-calling instructions, and classification/extraction prompts.

This agent handles **LLM application prompts** (prompts consumed by LLM APIs at runtime). It does NOT handle AI customization files (skills, commands, agents, rules). Use the `/tsh-create-custom-*` commands for those.

## Responsibilities

- Designing prompt structure with clear role separation, delimiters, and output format specification.
- Optimizing existing prompts for clarity, token efficiency, output quality, and consistency.
- Creating new prompts from business requirements with appropriate constraints and examples.
- Securing prompts against injection attacks with layered defenses (delimiter separation, input sanitization, output validation).
- Evaluating prompts through A/B testing, metric-based comparison, and edge case testing.

## Key Behaviors

- **Prompt-focused** — Handles only the prompt engineering aspects, returns to the software engineer for integration.
- **Security-first** — Every prompt includes injection defense as a non-negotiable default.
- **Technology-agnostic** — Patterns apply to any LLM provider (OpenAI, Anthropic, etc.).
- **Strictly follows the plan** — Does not deviate unless explicitly instructed.

## Approved plan precondition

For plan-based work, the agent validates the plan's `## Human Approval` record before it changes any file: it needs an approved plan whose approved revision equals the current `Plan Revision`. Without a valid record it does not start: interactive mode offers you the options (point it at the right plan, request approval through `/tsh-implement`, go back to `/tsh-architect`, or stop) and never records an approval itself; delegated mode returns `BLOCKED` and names the failed condition. Work without a plan is not affected. See the [approval gate](../workflow/standard-flow#approval-gate).

## Tool access

- **Read-write.**
- **No shell.** Shell access is denied on Claude Code.
- **Leaf agent.** It never delegates to other agents.
- **MCP servers:** Context7, Sequential Thinking.

## Skills loaded

- `tsh-engineering-prompts` (preloaded) - LLM prompt patterns: structure, security, evaluation
- `tsh-discovering-technical-context` - Discover project conventions and patterns before coding
- `tsh-reviewing-code` - Structured code review: correctness, security, quality
- `tsh-using-mcp-servers` - When and how to use the collection's MCP servers

## Invocation and modes

- **Delegated by:** the `tsh-engineering-manager` (LLM prompt tasks). In delegated mode the task starts with `MODE: delegated` and the agent ends its reply with a `STATUS` block instead of asking the user.
- **Direct use:** the agent runs in interactive mode and talks to you. See the invocation table in the [Agents overview](./overview#invoking-an-agent-directly).
