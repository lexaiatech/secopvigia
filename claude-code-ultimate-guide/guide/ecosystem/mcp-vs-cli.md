---
title: "MCP vs CLI — Decision Guide"
description: "When to use MCP servers vs CLI tools in Claude Code workflows. Tradeoffs, decision dimensions, and guidance by situation."
tags: [mcp, cli, tokens, architecture, decision]
---

# MCP vs CLI — Decision Guide

**Last updated**: March 2026

> Interactive version with guidance table and practitioner quotes: [cc.bruniaux.com/ecosystem/mcp-vs-cli/](https://cc.bruniaux.com/ecosystem/mcp-vs-cli/)

The debate emerged from a rapid succession of interface paradigms: browser-based AI (2022-23), then AI in the IDE with MCP connecting agents to external services (2024-25), then full CLI agents that execute commands and write files without an intermediary layer (2025-26). That progression explains why the question exists at all.

This page compares two integration patterns for giving Claude Code access to external tools and services: MCP servers and CLI tools. Neither is universally better. The right choice depends on your context — and most real workflows end up using both.

---

## What each approach does

**MCP servers** inject tool schemas into Claude's context at session start. Claude sees a structured list of available tools with parameters, types, and descriptions. It then calls those tools natively, receiving structured responses.

**CLI tools** are shell commands that Claude invokes via Bash. Claude drives them the same way a developer would: constructing command strings, parsing text output. No schema injection at startup. The shell is the interface.

---

## Tradeoffs

### MCP strengths

| Advantage | Detail |
|-----------|--------|
| **Structured interface** | Tool schemas guide Claude precisely — fewer hallucinated flags or arguments |
| **Complex auth** | OAuth, token refresh, secrets rotation handled by the server, not the prompt |
| **Structured output** | JSON responses are directly parseable by Claude and downstream agents |
| **Observability** | Remote MCP servers can log every call — essential for enterprise usage tracking and ROI attribution |
| **Distribution at scale** | Update the server once, all connected clients get the change. No per-machine package management. |
| **Non-technical users** | Users who never touch a terminal can access tools transparently via MCP connectors |
| **Weaker models** | A structured schema compensates when the model is less capable of parsing CLI help text |

### CLI strengths

| Advantage | Detail |
|-----------|--------|
| **Zero context overhead** | No schema injected at startup. Since v2.1.7 lazy loading closes most of the gap, but CLI is still the absolute minimum. |
| **Deterministic actions** | Explicit commands with predictable output are easier to audit and test |
| **Human + AI use** | The same CLI wrapper works for a developer running it manually and for Claude |
| **Frontier models** | Claude Opus/Sonnet 4.6 can drive complex CLIs (aws-cli, glab, gh) without a structured schema |
| **Speed** | No connection setup, no MCP handshake — direct subprocess execution |
| **Simplicity** | Easier to debug, log, and reason about than a remote server call chain |
| **Skills encapsulation** | A CLI wrapped in a skill is transparent to the user and keeps the tool logic version-controlled |

### MCP weaknesses

| Weakness | Detail |
|----------|--------|
| **Schema token cost** | Since v2.1.7, lazy loading (MCP Tool Search) means unused tools inject only their name, not their full schema. Cost is still non-zero: tool names load at startup, full schemas load on first use. The pre-v2.1.7 worst case (~55K tokens for a 5-server setup) now averages ~8.7K — an 85% reduction, but not zero. |
| **Connection overhead** | Session startup takes longer with many MCP servers connected |
| **Debugging difficulty** | Failures inside an MCP server are harder to trace than a failed shell command |
| **Maintenance complexity** | Running, updating, and securing remote MCP servers adds infrastructure |
| **Overkill for simple APIs** | A GitLab MCP that surfaces 20% of glab's functionality is worse than glab itself |

### CLI weaknesses

| Weakness | Detail |
|----------|--------|
| **No observability** | Shell commands on a local machine are invisible to ops/management tooling |
| **Distribution problem** | Keeping CLIs updated across a team requires package management discipline (brew, scoop, etc.) |
| **Weaker models struggle** | A less capable model may hallucinate flags or misread help text — schemas help |
| **No multi-agent structure** | CLI output requires parsing; structured MCP responses are more reliable across agent-to-agent handoffs |
| **Non-tech user barrier** | A non-technical user cannot be expected to have a configured CLI environment |

---

## The four decision dimensions

Before asking "MCP or CLI?", answer these four questions. They rank from most to least constraining.

### 1. Who is the end user?

This is the dominant variable. Everything else is secondary.

- **Non-technical user** (using a chat interface, no terminal) → **MCP or skill-encapsulated CLI**. You cannot expose a raw CLI to a non-dev user. Connectors must be MCP-based or wrapped invisibly in a skill that handles the CLI internally.
- **Technical user / developer** → continue to question 2.

### 2. Which model is driving the tool?

- **Frontier model** (Claude Opus/Sonnet 4.6) → strong enough to drive complex CLIs directly. A structured MCP schema adds overhead without proportional benefit.
- **Smaller or local model** (Qwen, Mistral, lighter deployments) → structured MCP schemas compensate for weaker CLI parsing ability. MCP is more reliable here.

### 3. Does your organization need observability?

- **Yes** (enterprise, C-level reporting, compliance, ROI attribution on AI spend) → **MCP Remote server**. Local CLI calls are invisible. A remote MCP server can log every tool invocation, associate it with a user, and feed dashboards. You cannot replicate this with CLIs on local machines.
- **No** (individual dev, local workflow) → observability is not a constraint. CLI is fine.

### 4. How often does the tool schema change?

- **Stable API** (mature tool, versioned interface) → MCP investment pays off over time.
- **Rapidly changing** or **thin wrapper** → CLI is cheaper to maintain. A hand-rolled glab wrapper that exposes only the 5 commands you actually use is more durable than a GitLab MCP that duplicates the full API surface.

---

## Guidance by situation

Quick reference — not rules, but directional defaults.

| Situation | Lean toward | Rationale |
|-----------|-------------|-----------|
| Non-technical user, chat interface | **MCP / Skill** | CLI is inaccessible; connectors must be invisible |
| Frontier model (Claude 4.x), developer workflow | **CLI** | Model handles it natively; schemas are overhead |
| Smaller/local model | **MCP** | Schema guides the model reliably |
| Enterprise, observability required | **MCP Remote** | Only way to log, attribute, and report on usage |
| Team distribution (10+ devs) | **MCP** | Central update vs per-machine CLI maintenance |
| Individual dev, local machine | **CLI or skill** | Simpler, faster, no infrastructure |
| Deterministic actions (git, CI, deploy) | **CLI** | Explicit commands, predictable output, auditable |
| Complex auth (OAuth, token refresh) | **MCP** | Server handles auth; CLI would require credential plumbing |
| Tight context budget / many tools loaded | **CLI** | Still the minimum-overhead option. Lazy loading (v2.1.7+) reduces MCP cost significantly, but CLI has zero schema cost by design. |
| Agent-to-agent structured output | **MCP** | JSON responses are more reliable than parsed CLI text |
| Debugging / prototyping a new integration | **CLI** | Easier to inspect, faster to iterate |
| Browser automation (non-frontier model) | **MCP** | Playwright MCP structures interaction reliably |
| Browser automation (frontier model, Claude Code) | **CLI + skill** | playwright-cli + skill reported faster and more efficient in practice |
| GitLab / GitHub access | **CLI** (glab, gh) | Official CLIs are richer than most MCP wrappers |
| Documentation lookup (Context7) | **MCP** | No CLI equivalent; structured doc retrieval has no shell analog |

---

## The hybrid is the default

Most production workflows don't choose one. They use both, with each covering the layer it handles best.

**A practical example** (from practitioners):

- **Inner layer** (local dev iteration, git, file ops, shell scripts) → CLI, fast, deterministic, no overhead
- **Outer layer** (CI/CD, shared infrastructure, cross-team services) → MCP Remote, observable, centralized, scalable
- **Skill layer** (user-facing actions, CLI tools encapsulated for non-tech users) → CLIs wrapped in skills, transparent to the end user

The mistake is applying one answer to both layers. A solo developer building a Claude Code workflow for themselves should mostly use CLIs. A team deploying an AI assistant to non-technical colleagues should mostly use MCP.

---

## Token cost of MCP schemas — what the numbers look like

Since v2.1.7 (January 2026), Claude Code uses **MCP Tool Search** (lazy loading) by default. This changes the token math significantly, but does not eliminate schema cost entirely.

**How lazy loading works:** instead of injecting all tool schemas at session start, Claude receives only tool names in an `<available-deferred-tools>` block. Full schemas are fetched via `ToolSearch` only when Claude decides to call a specific tool. Unused tools in a session cost only their name in context (~0 schema tokens), not the full definition.

**Measured impact** (Anthropic benchmarks, 5-server setup):

| Scenario | Token overhead | Note |
|----------|---------------|------|
| Before v2.1.7 (eager loading) | ~55,000 tokens | All schemas preloaded |
| After v2.1.7 (lazy loading) | ~8,700 tokens | 85% reduction |
| CLI (no MCP) | ~0 tokens | Baseline |

The old worst-case claim of "500-2,000 tokens per server" described eager loading, which is no longer the default. With lazy loading, the cost per unused server is near zero. The cost per *used* server (~600 tokens per tool schema loaded on demand) remains real, but is now pay-per-use rather than always-on.

**What still adds overhead even with lazy loading:**

- Tool names are still injected at startup (one line per tool per server)
- Schemas load at first invocation — long sessions using many tools accumulate cost
- Connection setup per server is unchanged (latency, not tokens)
- Many connected MCP servers still means more names in context, even if schemas stay deferred

**Configuration** (v2.1.9+): the `ENABLE_TOOL_SEARCH` environment variable controls the threshold. `auto:N` triggers lazy loading when MCP tools exceed N% of context (default 10%).

**Mitigation strategies** (still relevant, lower urgency):

- Load MCP servers selectively per project (project-level config vs global config)
- Use CLI tools for high-frequency tight loops where any overhead compounds (compile → test → fix)
- Monitor token usage per session to identify which schemas are being loaded at invocation time
- Consider a CLI wrapper for tools you use constantly but don't need structured output from

---

## Tooling in this space

| Tool | What it does | Status |
|------|-------------|--------|
| **RTK** (Rust Token Killer) | Filters CLI output before it reaches Claude's context — reduces response verbosity, not schema overhead | Production-ready, actively maintained |
| **MCPorter** (steipete) | TypeScript runtime for calling MCP servers from scripts, generating CLI wrappers, and emitting typed TS clients. Useful for testing MCP servers and writing hooks that need MCP access. | 3K stars, MIT, 2+ weeks, ready to use |
| **mcp2cli** (knowsuchagency) | Converts MCP/OpenAPI/GraphQL to runtime CLI, eliminating schema injection. Claims 96-99% token savings. | 1.2K stars, 8 days old — watch list, not production-ready yet |

Note on mcp2cli: the core claim (eliminate schema injection by converting MCP to CLI) is architecturally valid. But Claude Code manages MCP connections internally, so the token savings don't apply directly to the standard Claude Code workflow. The Claude Code skill integration (`npx skills add knowsuchagency/mcp2cli --skill mcp2cli`) is the practical entry point.

---

## What practitioners say

A few representative perspectives from experienced Claude Code users:

> "I prefer CLI for deterministic actions. For GitLab interactions I use glab (the GitLab MCP is too limited) wrapped in a custom CLI — usable by both humans and AI." — practitioner

> "On Claude Code with frontier models, fewer MCPs is better. I replaced playwright-mcp with playwright-cli + skill — faster and more effective. I still use context7-mcp only because I haven't found a CLI equivalent." — practitioner

> "The CLI vs MCP debate is only happening among devs doing dev things. But there's one fundamental constraint: you cannot propose a CLI solution to a non-technical user who just wants to use their tool simply." — practitioner

> "For enterprise industrialization, observability is non-negotiable. CLI on a local machine is a black box. MCP Remote gives you the logging that C-levels need to attribute investment." — practitioner

> "Frontier models are strong enough to drive a CLI directly. A weaker local model will struggle — that's where MCP schemas earn their overhead." — practitioner

---

*Back to [MCP Servers Ecosystem](./mcp-servers-ecosystem.md) | [Third-Party Tools](./third-party-tools.md) | [Main guide](../ultimate-guide.md)*
