# Decision: Dlaczego usunięto odwołania do `*.prompt.md` w agentach

**Status:** ACCEPTED  
**Date:** 2026-05-21

## Context

Po refaktorze Option 4 (`agents-skills-quality.refactor-plan.md`) w plikach `.cursor/skills/agents/` zniknęły ścieżki typu `tsh-plan.prompt.md`, `tsh-review-ui.prompt.md`. Pytanie: czy usunięto pliki promptów, czy tylko nazewnictwo w dokumentacji agentów.

W repozytorium **nie ma już** plików `.cursor/**/*.prompt.md` ani `.github/prompts/*.prompt.md` w bieżącym drzewie Cursor — migracja Copilot → Cursor zamieniła je na `SKILL.md` w `commands/` i `internal/`. Agenci (np. `tsh-engineering-manager`) nadal mieli **linki do nieistniejących plików**, co mogło prowadzić agenta do szukania martwych ścieżek.

## Options Considered

### Option 1: Zostawić `*.prompt.md` w tekście agentów jako „historyczną” nazwę
- **Pros:** Zgodność ze starym słownictwem Copilot i changelogiem.
- **Cons:** Agent czyta nieistniejące pliki; rozjazd z faktyczną strukturą repo; mylenie z formatem Cursor Subagents (`.cursor/agents/*.md`).

### Option 2: Zamienić odwołania na rzeczywiste ścieżki `*/SKILL.md` (commands / internal)
- **Pros:** Linki wskazują pliki, które istnieją; zgodne z `tsh-migrating-copilot-to-cursor`; semantyka bez zmian (ten sam workflow, inny format).
- **Cons:** Trzeba zaktualizować pozostałe legacy miejsca (changelog, przykłady w workflows) osobno.

### Option 3: Przywrócić fizyczne pliki `*.prompt.md` obok `SKILL.md`
- **Pros:** Stare linki działają bez edycji agentów.
- **Cons:** Duplikacja treści; Cursor indeksuje `SKILL.md` — dwa formaty na ten sam workflow; sprzeczne z przyjętą migracją.

## Decision

**Nie usunięto plików promptów z repozytorium — usunięto wyłącznie błędne odwołania do rozszerzenia `.prompt.md` w definicjach agentów** i zastąpiono je ścieżkami do istniejących skilli:

| Było (Copilot / legacy) | Jest (Cursor) |
| ----------------------- | ------------- |
| `.github/prompts/tsh-review.prompt.md` | `.cursor/skills/commands/tsh-review/SKILL.md` |
| `.github/internal-prompts/tsh-plan.prompt.md` | `.cursor/skills/internal/tsh-plan/SKILL.md` |
| `tsh-implement-ui.prompt.md` (internal) | `.cursor/skills/internal/tsh-implement-ui/SKILL.md` |

**Koncept „promptu” jako entry-pointu workflow nadal istnieje** — w Cursor nazywa się **command skill** (`commands/<name>/SKILL.md` z `disable-model-invocation: true`) lub **internal skill** (`internal/<name>/SKILL.md`). Zmieniła się **nazwa pliku i lokalizacja**, nie rola w orchestracji.

W agentach Cursor-customization zastąpiono też sformułowanie „plik `.prompt.md`” → „command skill w `commands/`”, żeby nie sugerować formatu, którego repo już nie używa.

## Consequences

- EM i inni orchestratorzy muszą delegować: „przeczytaj i wykonaj `…/SKILL.md`”, nie „uruchom `*.prompt.md`”.
- `tsh-prompt-engineer` nadal dotyczy **promptów runtime w aplikacji** (LLM API) — to inna domena niż Cursor command skills.
- Changelog i niektóre przykłady w `workflows/` mogą nadal mówić `.prompt.md` — to dokumentacja historyczna, nie kontrakt dla agentów.
- Przywrócenie samego rozszerzenia `.prompt.md` bez plików **nie** jest zalecane.

## Rationale

Refaktor realizował `agents-skills-vs-cursor-subagents.decision.md` (Option 4): naprawa **martwych linków**, nie zmiana zachowania workflow. Mapowanie jest jawne w `tsh-migrating-copilot-to-cursor`. Option 3 (duplikaty plików) zwiększałby koszt utrzymania bez korzyści w Cursor. Option 1 zostawiałaby agentów z instrukcją odczytu nieistniejących artefaktów.
