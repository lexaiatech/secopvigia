---
title: "Credits and External Inspirations"
description: "Open-source projects and engineering teams whose work informed specific patterns in this guide"
tags: [credits, attribution, open-source]
---

# Credits and External Inspirations

This guide documents patterns from the Claude Code community. Some sections are directly inspired by open-source repos, blog posts, or public engineering work. This page consolidates attributions in one place.

---

## Packmind Engineering Team

**Repo**: [github.com/packmind/packmind](https://github.com/packmind/packmind)
**Author**: Cédric Teyton (CTO, Packmind)
**License**: Apache 2.0

Packmind maintains a production Claude Code configuration in their open-source repo. Several patterns documented in this guide were inspired by their `.claude/` setup:

### Pattern 1: MCP Reference File

**Guide section**: [Documenting an MCP for Claude](../ecosystem/mcp-servers-ecosystem.md#documenting-an-mcp-for-claude-the-reference-file-pattern)
**Source**: `.claude/skills/datadog-analysis/references/datadog_mcp.md`

A `references/<mcp-name>.md` file read by the skill before any MCP call. Captures query syntax gotchas, required parameter combinations, working examples, and noise exclusion rules specific to one MCP server.

### Pattern 2: Skeptical Reviewer Sub-Agent

**Guide section**: [Pattern: Skeptical Reviewer Sub-Agent](../ultimate-guide.md#pattern-skeptical-reviewer-sub-agent)
**Source**: `.claude/skills/playbook-audit/references/report-agent.md`

A fourth agent in a multi-agent audit pipeline whose job is to reject false positives from the first three agents. Operates with explicit false-positive criteria and requires evidence from both artifacts before keeping any finding.

### Pattern 3: Shared Ground Truth Injection

**Guide section**: [Skill Design Patterns](./skill-design-patterns.md#shared-ground-truth-injection)
**Source**: `.claude/skills/doc-audit/SKILL.md`

The orchestrator computes a shared factual baseline (nav structure, CLI commands, file list) once, then injects the same block into all parallel sub-agent prompts. Prevents each sub-agent from re-discovering the same facts independently.

### Pattern 4: Pre-filtered References via Frontmatter Paths

**Guide section**: [Skill Design Patterns](./skill-design-patterns.md#pre-filtered-references-via-frontmatter-paths)
**Source**: `.claude/skills/qa-review/SKILL.md`

The orchestrator reads rules files, parses `paths:` frontmatter glob patterns, matches them against modified files, and passes only applicable rules to each review agent. Progressive disclosure applied to standards, not just documentation.

### Pattern 5: Handoff Triad with Merge Semantics

**Guide section**: [Session Handoff Pattern](../ultimate-guide.md#session-handoff-pattern) and templates at `examples/commands/handoff/`
**Source**: `.claude/commands/create-handoff.md`, `resume-handoff.md`, `update-handoff.md`

A three-command protocol for session continuity: `create-handoff` initializes a structured document, `update-handoff` applies section-specific merge rules (append-only for work log, replace for status), and `resume-handoff` loads the latest document into context.

### Pattern 6: Recipe Template with Context Validation Checkpoints

**Guide section**: [Skill Design Patterns](./skill-design-patterns.md#recipe-template-and-context-validation-checkpoints) and template at `examples/commands/recipe-template.md`
**Source**: recurring pattern across Packmind command files

A command template structure where a "Context Validation Checkpoints" section lists preconditions Claude must verify before executing the recipe steps. Reduces errors caused by missing context or wrong environment.

---

## Packmind context-evaluator

**Repo**: [github.com/PackmindHub/context-evaluator](https://github.com/PackmindHub/context-evaluator)
**Author**: Packmind engineering team
**License**: MIT

context-evaluator is an OSS CLAUDE.md / AGENTS.md quality analyzer. Two patterns from its source were extracted for the guide:

### Pattern 7: Runtime Prompt Logging

**Guide section**: [Skill Design Patterns](./skill-design-patterns.md#runtime-prompt-logging)
**Source**: `src/shared/evaluation/runtime-prompt-logger.ts`

Always-on blocking write of the full evaluator prompt to `prompts/debug/` before invoking the AI provider. Survives provider crashes and timeouts. Never throws. Separate from the `--debug` flag.

### Pattern 8: Adaptive Unified/Parallel Mode

**Guide section**: [Skill Design Patterns](./skill-design-patterns.md#adaptive-unifiedparallel-mode)
**Source**: `src/shared/evaluation/runner.ts` — `canUseUnifiedMode()`

Token-threshold switching between single-agent unified evaluation (cross-file detection) and parallel independent agents per file. Threshold default: 100K tokens.

---

## Anthropic Engineering Team

**skill-creator**: The `skill-creator` skill vendored in the Packmind repo (and referenced in this guide's skill evaluation section) was originally published by Anthropic. It contains the canonical evaluation harness for testing skills: evals filesystem convention, blind A/B comparator, description optimization loop, and benchmark aggregation scripts.

---

## Adding to This File

When a guide section is directly inspired by or adapted from external open-source work, add an entry here. Include:
- Repository URL
- Author / organization name
- License
- Which pattern was borrowed and from which source file
- Which guide section it appears in
