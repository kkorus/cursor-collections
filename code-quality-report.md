# Code Quality Report - copilot-collections

## Overview

| Field | Value |
|---|---|
| Repository | copilot-collections |
| Repository Type | Single System (two distinct layers) |
| Date | 2026-05-21 |
| Layers/Apps Analyzed | `.cursor/` (Skills / Rules / Agents), `website/` (Docusaurus documentation app) |

## Executive Summary

The repository is in good overall health. The `.cursor/` layer — the core product (skills, agents, rules, commands) — is structurally sound: all skill frontmatter `name` fields consistently match their directory names, cross-references between skills use the correct `tsh-` prefix, and the layer hierarchy (`agents/`, `commands/`, `internal/`, `workflows/`) is clean and well-separated. There is one minor but notable self-referential violation: the naming-convention rule file itself doesn't follow the convention it enforces.

The `website/` layer (Docusaurus) is clean React/TypeScript code with good component separation. The main issues are content-level: the repository is in the middle of a migration from GitHub Copilot to Cursor, and several files still carry stale references to the old setup (`.vscode/mcp.json`, VS Code Copilot chat settings, `.github/` paths, `.copilot/` directory). These are the most critical issues to fix before the changes ship, as they will confuse new users following the installation documentation. There is also one clear CSS duplication — the primary/secondary button styles are copy-pasted between two component stylesheets.

Recommended priority: fix stale installation docs (critical for user-facing correctness), fix the rule naming violation, clean up the CSS duplication, and address the minor code-style inconsistencies.

---

## Findings by Layer/App

### Layer 1: `.cursor/` (Skills / Rules / Agents)

#### Dead Code

| # | Severity | Type | Location | Description |
|---|---|---|---|---|
| 1 | 🟢 | No issues | — | No unused skills, agents, or unreferenced cross-dependencies found. All `name` frontmatter fields match their directory names (100% compliance). |

#### Duplications

| # | Severity | Type | Locations | Description | Recommendation |
|---|---|---|---|---|---|
| 1 | 🟢 | No issues | — | No duplicated logic found across skill files. Workflows are clearly separated by responsibility. | — |

#### Improvement Opportunities

| # | Severity | Category | Location | Description | Recommendation |
|---|---|---|---|---|---|
| 1 | 🟡 | Naming Convention | `.cursor/rules/naming-conventions.mdc` | The rule file itself violates the naming convention it defines. Per the rule: "Rules: `tsh-<topic>.mdc`". The file should be `tsh-naming-conventions.mdc` | Rename to `tsh-naming-conventions.mdc` and update the `globs` frontmatter accordingly |
| 2 | 🟢 | Consistency | `website/docs/agents/overview.md:85-97` | Internal links reference `./copilot-engineer`, `./copilot-orchestrator`, `./copilot-researcher`, `./copilot-artifact-creator`, `./copilot-artifact-reviewer`, but display text shows "Cursor Engineer" / "Cursor Orchestrator" etc. The agent doc files haven't been renamed to match the new `cursor-*` terminology yet, creating a name/path mismatch | Rename `website/docs/agents/copilot-*.md` files to `cursor-*.md` and update all cross-references |

---

### Layer 2: `website/` (Docusaurus documentation app)

#### Dead Code

| # | Severity | Type | Location | Description |
|---|---|---|---|---|
| 1 | 🟡 | Dead CSS | `website/src/components/HeroSection/index.module.css:91-97` | `.divider` class is defined in this file but never referenced in `HeroSection/index.tsx`. Dividers are managed from `website/src/pages/index.module.css` and applied in `pages/index.tsx` |

#### Duplications

| # | Severity | Type | Locations | Description | Recommendation |
|---|---|---|---|---|---|
| 1 | 🟡 | Duplicated CSS | `HeroSection/index.module.css:56-88`, `GettingStartedSection/styles.module.css:47-96` | `btnPrimary` and `btnSecondary` styles are defined identically in both files (same background `rgba(180,180,255,0.2)`, color `#B4B4FF`, padding `11px 22px`, border-radius `6px`, transition). `GettingStartedSection` adds dark-mode variants on top. | Extract shared button tokens to `website/src/css/custom.css` as global classes `.btn-primary` / `.btn-secondary`, or create a shared `CtaButton` component. Remove the duplicate definitions from both CSS modules. |

#### Improvement Opportunities

| # | Severity | Category | Location | Description | Recommendation |
|---|---|---|---|---|---|
| 1 | 🔴 | Stale Content | `website/src/components/GettingStartedSection/index.tsx:18-48` | Steps 2 and 3 describe VS Code User Settings with `chat.promptFilesLocations`, `chat.modeFilesLocations` (GitHub Copilot-specific settings) and `Copy .vscode/mcp.json` — both of which belong to the old GitHub Copilot setup. `.vscode/mcp.json` is deleted in the current diff. New users following these steps will not be able to set up the tool. | Update steps to reflect the Cursor installation path: Cursor Settings → import from GitHub, or symlink to `~/.cursor/skills/`. Replace `.vscode/mcp.json` reference with `.cursor/mcp.json`. |
| 2 | 🔴 | Stale Content | `website/docs/integrations/overview.md:32` | Text reads "All servers are configured in `.vscode/mcp.json`" — this file is being deleted in the current diff. | Update to reference `.cursor/mcp.json`. |
| 3 | 🔴 | Stale Content | `website/docs/skills/creating-instructions.md:17,21,42` | References `.github/cursor-rules.mdc` and `.github/instructions/` folder paths — both deleted in the current diff. | Update to reference `.cursor/rules/*.mdc` paths. |
| 4 | 🟡 | Stale Content | `website/docs/skills/technical-context-discovery.md:34` | References `.copilot/` additional configuration directory, which is not part of the current Cursor setup. | Remove or update the reference to reflect the `.cursor/` structure. |
| 5 | 🟡 | Code Style | `website/src/components/SdlcDiagram/index.tsx:52` | Inline style `style={{fontSize: '0.7rem', opacity: 0.7, marginLeft: '0.5rem'}}` on the Engineering Manager sub-label. Inconsistent with the CSS modules pattern used by every other component in the project. | Move to `SdlcDiagram/styles.module.css` as a named class. |
| 6 | 🟡 | Design System | `website/src/components/SdlcDiagram/index.tsx:207` | SVG text element hardcodes `fontFamily="DM Mono,monospace"`. The project uses JetBrains Mono (loaded via Google Fonts in `docusaurus.config.ts`) for monospace. DM Mono is not loaded anywhere. | Replace with `JetBrains Mono,monospace` or use the CSS variable `var(--ifm-font-family-monospace)` in a `<style>` block. |
| 7 | 🟢 | Code Style | `website/src/components/HeroSection/AnimationCanvas.tsx:156-168` | All canvas positioning uses inline styles (position, top, left, transform, etc.). Inconsistent with the CSS modules pattern, though understandable given canvas rendering constraints. | Extract static layout styles to `AnimationCanvas.module.css`, keep only runtime/dynamic values inline. |
| 8 | 🟢 | Branding | `website/docusaurus.config.ts:5,9,92,99-103` | Site title is "Copilot Collections", URL is `copilot-collections.tsh.io`, navbar title is "Copilot Collections". The project is partially migrated to Cursor branding in docs but the site config and domain have not changed. | Decide if this is intentional (keep domain for backward compat) or if `docusaurus.config.ts` also needs updating as part of the migration. |

---

## Architecture Observations

**`.cursor/` layer**

The skill taxonomy is clean and well-thought-out: `commands/` for user-facing slash commands, `agents/` for role-based agents, `workflows/` for reusable skill building blocks, and `internal/` for engine-level skills not directly invoked by users. This is a solid architecture that scales well.

The frontmatter `name` field is 100% consistent with directory naming across all 57 SKILL.md files inspected. The `tsh-` prefix is correctly applied to every artifact. Cross-skill references use the correct prefixed names.

The only architectural concern is the missing `tsh-` prefix on `naming-conventions.mdc` itself — a minor self-referential inconsistency that should be fixed since the file is the authoritative source of the naming rule.

**`website/` layer**

The Docusaurus app has a clean component structure: one component per directory, each with `index.tsx` + `styles.module.css`. The separation of concerns is correct — no business logic in presentation components, no cross-component CSS leakage.

The main architectural gap is the absence of shared UI primitives. Currently, the `btnPrimary`/`btnSecondary` button pattern is duplicated between `HeroSection` and `GettingStartedSection`. As the landing page grows, more visual patterns will need sharing. Introducing a minimal set of shared CSS utilities in `custom.css` (or a `shared/` component directory) would prevent further duplication.

There are no tests at the website layer — acceptable for a static documentation site but worth noting if the component library grows.

**Content / migration integrity**

The most significant concern is the partially-completed migration from GitHub Copilot to Cursor. The `.cursor/` skill files are fully migrated. However, the website's installation guide (`GettingStartedSection`) and several documentation pages still reference the old VS Code Copilot setup (`.vscode/mcp.json`, `chat.promptFilesLocations`, `.github/` paths). This creates a broken onboarding experience where the docs don't match the actual repository structure. These should be treated as blockers before merging.

---

## Summary

| Category | 🔴 Critical | 🟡 Important | 🟢 Nice to Have | Total |
|---|---|---|---|---|
| Dead Code | 0 | 1 | 0 | 1 |
| Duplications | 0 | 1 | 0 | 1 |
| Improvements | 3 | 4 | 3 | 10 |
| **Total** | **3** | **6** | **3** | **12** |

---

## Recommended Action Plan

### Immediate (Critical)

1. **Fix `GettingStartedSection/index.tsx`** — Replace steps 2 and 3 with the correct Cursor installation steps (Cursor Settings import / symlink, `.cursor/mcp.json` reference).
2. **Fix `website/docs/integrations/overview.md:32`** — Replace `.vscode/mcp.json` with `.cursor/mcp.json`.
3. **Fix `website/docs/skills/creating-instructions.md`** — Replace `.github/cursor-rules.mdc` and `.github/instructions/` references with `.cursor/rules/*.mdc`.

### Short-term (Important)

4. **Rename `.cursor/rules/naming-conventions.mdc`** to `tsh-naming-conventions.mdc` to comply with the naming convention the file documents.
5. **Fix `website/docs/skills/technical-context-discovery.md:34`** — Remove the stale `.copilot/` directory reference.
6. **Move inline style in `SdlcDiagram/index.tsx:52`** to `styles.module.css`.
7. **Fix hardcoded font in `SdlcDiagram/index.tsx:207`** — replace `DM Mono` with `JetBrains Mono,monospace`.
8. **Extract shared button CSS** — Remove duplicate `btnPrimary`/`btnSecondary` definitions and consolidate into `custom.css` or a shared component.
9. **Rename `website/docs/agents/copilot-*.md`** to `cursor-*.md` and update all cross-references to align display text with file paths.

### Long-term (Nice to Have)

10. **Remove dead `.divider` class** from `HeroSection/index.module.css`.
11. **Extract `AnimationCanvas` inline styles** to a CSS module.
12. **Decide on branding in `docusaurus.config.ts`** — align site title, URL, and navbar with the final Cursor/Copilot Collections branding decision.
