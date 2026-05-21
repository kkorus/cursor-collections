# Decision: Lokalizacja i jakość agentów w `.cursor/skills/agents/`

**Status:** ACCEPTED  
**Date:** 2026-05-21  
**Implemented:** Option 4 — `specifications/refactoring/agents-skills-quality.refactor-plan.md` (2026-05-21)

## Context

Pytanie: czy agenci w `.cursor/skills/agents/` są dobrze napisani i w dobrym miejscu, w świetle [dokumentacji Cursor Subagents](https://cursor.com/docs/subagents).

Repozytorium ma **16** plików `SKILL.md` w `.cursor/skills/agents/` (12 ról użytkowych + 4 wewnętrzne workerów Cursor). Katalog **`.cursor/agents/` nie istnieje** — zero natywnych subagentów Cursor.

Migracja z Copilota (`tsh-migrating-copilot-to-cursor`) mapuje `.github/agents/*.agent.md` → `.cursor/skills/agents/<name>/SKILL.md`, a nie na `.cursor/agents/`.

## Dwa różne mechanizmy w Cursor

| Aspekt | **Agent Skills** (`.cursor/skills/`) | **Subagents** (`.cursor/agents/`) |
| ------ | ------------------------------------ | --------------------------------- |
| Format | folder + `SKILL.md`, frontmatter `name`, `description` | pojedynczy `.md`, frontmatter `name`, `description`, `model`, `readonly`, `is_background` |
| Delegacja | auto-discovery, `@tsh-architect`, `/tsh-architect` | Task tool, osobne okno kontekstu |
| Kiedy używać (wg Cursor) | zadania jednorazowe, wiedza domenowa, powtarzalne workflow | długi research, równoległa praca, weryfikacja niezależna, wiele kroków |
| Ten repo | **tak** — `agents/`, `workflows/`, `commands/`, `internal/` | **nie** — brak plików |

Folder `agents/` w drzewie skills jest **organizacyjny** (jak `workflows/` czy `commands/`) — Cursor indeksuje wszystkie `SKILL.md` rekurencyjnie; rola folderu nie zmienia API.

## Ocena jakości (stan na 2026-05-21)

### Co jest dobrze

- **Opisy (`description`)** — konkretne, z triggerami („Use when…”, „Invoke with @…”), zgodne z best practice subagentów (sygnał kiedy delegować).
- **Separacja odpowiedzialności** — agenci = WHO; `workflows/` = HOW; `commands/` + `internal/` = entry-pointy z `disable-model-invocation: true` (`disable-model-invocation-explained.decision.md`).
- **Wzorzec orchestratora** — `tsh-engineering-manager`, `tsh-cursor-orchestrator` odzwierciedlają wzorzec z docs (plan → implement → verify), z jasną delegacją i izolacją kontekstu *w instrukcjach*.
- **Workerzy Cursor** — `tsh-cursor-researcher`, `tsh-cursor-artifact-creator`, `tsh-cursor-artifact-reviewer` mają `disable-model-invocation: true` (delegate-only).
- **Prefiks `tsh-`** i `name` zgodne z folderem (`tsh-naming-conventions.mdc`).

### Problemy

| Problem | Wpływ |
| ------- | ----- |
| **Brak `.cursor/agents/`** | Orchestratory opisują delegację (`runSubagent`), ale nie korzystają z natywnego Task tool + izolacji kontekstu z docs subagentów |
| **Legacy ścieżki `.prompt.md`** | Np. `tsh-engineering-manager` — ~28 odwołań do plików, które po migracji to `commands/*/SKILL.md` lub `internal/*/SKILL.md`; agent może szukać nieistniejących plików |
| **Terminologia `runSubagent`** | Copilot-era; w Cursor → Task tool + `subagent_type` / custom subagent z `.cursor/agents/` |
| **Szablon XML vs Markdown** | `tsh-creating-agents` wymaga `<agent-role>`, `<tool-usage>` — większość agentów używa `## Agent Role` (niespójność, gorsza parsowalność) |
| **`disable-model-invocation` na agentach wewnętrznych** | Tylko trio Cursor; `tsh-architect-reviewer` (i inne „internal”) **nie** ma flagi — mogą pojawić się w `/` i być auto-ładowane mimo że docs mówią „not for direct user invocation” |
| **Frontmatter `tools`, `handoffs`, `agents`** | W szablonie tworzenia — w rzeczywistych plikach przeniesione do body („Recommended tools”); Cursor Skills docs **nie** dokumentują `tools` w YAML — to pozostałość po Copilot |
| **Dokumentacja `overview.md`** | Sugeruje `/agent-name`; faktycznie: `@tsh-*` i `/tsh-*` (skills), nie `/verifier` (subagent syntax) |

## Options Considered

### Option 1: Zostawić wyłącznie `.cursor/skills/agents/` (status quo)
- **Pros:** Zgodne z migracją Copilot → Skills; jeden model mentalny; `@tsh-architect` działa; workflow skills auto-loadują się przy implementacji.
- **Cons:** Brak natywnej izolacji kontekstu przy delegacji EM/orchestrator; legacy linki do `.prompt.md`; mylenie „agent skill” z „subagent” w docs Cursor.

### Option 2: Przenieść wszystko do `.cursor/agents/*.md`
- **Pros:** Pełna zgodność z [Subagents docs](https://cursor.com/docs/subagents); Task tool; `model` / `readonly` / `is_background`.
- **Cons:** Duża migracja; utrata integracji z Agent Skills (progressive disclosure, `workflows/`); duplikacja z `commands/`; `/name` koliduje z `/tsh-*` commands.

### Option 3: Warstwa hybrydowa (rekomendowane ulepszenie)
- **Pros:** `skills/agents/` = persona + skills + `@` invocation; cienkie `.cursor/agents/` tylko dla ról delegowanych przez orchestratory (reviewer, researcher, implementer) z krótkim promptem i `model`/`readonly`; EM używa Task zamiast `runSubagent`.
- **Cons:** Dwa pliki na rolę do utrzymania (lub generowanie z jednego źródła); wymaga refaktoru `tsh-engineering-manager` i linków.

### Option 4: Tylko naprawa jakości w `skills/agents/` (bez `.cursor/agents/`)
- **Pros:** Niski koszt: zamiana `.prompt.md` → `SKILL.md`, `disable-model-invocation` na internal agents, ujednolicenie XML, aktualizacja docs.
- **Cons:** Nadal brak context isolation z docs subagentów przy delegacji.

## Decision

**Lokalizacja `.cursor/skills/agents/` jest poprawna dla architektury tego repozytorium (Agent Skills + migracja Copilot), ale nie jest tym samym co natywne Subagents z `.cursor/agents/`.**

**Nie przenosić hurtowo** agentów do `.cursor/agents/`.

**Krótkoterminowo (Option 4):** uznać obecne miejsce za właściwe i naprawić jakość treści (linki, flagi, terminologia Task tool).

**Średnioterminowo (Option 3, opcjonalnie):** dodać `.cursor/agents/` tylko dla ról delegowanych wieloetapowo (code-reviewer, ui-reviewer, architect-reviewer, cursor workers, ewentualnie software-engineer) — gdy priorytetem jest izolacja kontekstu i równoległość zgodnie z docs Cursor.

## Consequences

- Użytkownik `@tsh-engineering-manager` dostaje **skill z personą**, nie **subagenta** w sensie Cursor docs — delegacja zależy od głównego agenta i jego kontekstu.
- `/tsh-architect` w menu `/` to skill, nie dedykowany subagent `/architect`.
- Refactor `tsh-engineering-manager` powinien odwoływać się do `internal/*/SKILL.md` i `commands/*/SKILL.md`, nie `*.prompt.md`.
- `tsh-architect-reviewer` i pozostałe internal agents powinny dostać `disable-model-invocation: true` (jak trio Cursor).
- Dokumentacja website (`overview.md`) wymaga korekty: Skills vs Subagents, `@` vs `/`.
- Pełne dopasowanie do Subagents docs wymaga osobnego planu (`/tsh-refactor`), nie tylko `/tsh-ask`.

## Rationale

[Cursor Subagents](https://cursor.com/docs/subagents) mówi wprost: custom subagents → `.cursor/agents/`. [Agent Skills](https://cursor.com/docs/skills) mówi: wszystkie `SKILL.md` pod `.cursor/skills/` — w tym zagnieżdżone katalogi.

Repozytorium świadomie wybrało Skills (decyzje migracji, `disable-model-invocation-explained`, struktura `commands/workflows/agents`). To nie jest błąd lokalizacji — to **inny produkt Cursor**. Jakość treści jest **dobra w opisach i podziale ról**, **słabsza w spójności technicznej** (legacy paths, szablon XML, brak natywnej delegacji).

Option 2 odrzucona ze względu na koszt i utratę auto-load workflow. Option 1 akceptowalna po naprawach z Option 4. Option 3 — gdy zespół chce orchestracji zgodnej z docs subagentów bez rezygnacji z Skills.
