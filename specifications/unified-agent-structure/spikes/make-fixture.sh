#!/usr/bin/env bash
# Builds the scratch fixture for spikes 1.1 (Cursor) and 1.3 (Codex).
# Usage: make-fixture.sh <target-dir> [--variant copies|symlinks|differing]
#          [--cursor-mcp mcpServers|servers] [--many N] [--legacy] [--force]
# Layout: <target>/project (open this in Cursor / run codex here)
#         <target>/fake-home (only with --legacy; a simulated ~, never the real one)
set -euo pipefail

usage() { sed -n '2,6p' "$0" | sed 's/^# \{0,1\}//'; exit "${1:-0}"; }
die() { echo "make-fixture: $*" >&2; exit 1; }

TARGET="" VARIANT="copies" CURSOR_MCP_KEY="mcpServers" MANY=0 LEGACY=0 FORCE=0
while [ $# -gt 0 ]; do
  case "$1" in
    --variant) VARIANT="${2:-}"; shift 2 ;;
    --cursor-mcp) CURSOR_MCP_KEY="${2:-}"; shift 2 ;;
    --many) MANY="${2:-}"; shift 2 ;;
    --legacy) LEGACY=1; shift ;;
    --force) FORCE=1; shift ;;
    -h|--help) usage 0 ;;
    -*) die "unknown flag: $1" ;;
    *) [ -z "$TARGET" ] || die "only one target dir allowed"; TARGET="$1"; shift ;;
  esac
done
[ -n "$TARGET" ] || usage 1
case "$VARIANT" in copies|symlinks|differing) ;; *) die "--variant must be copies|symlinks|differing" ;; esac
case "$CURSOR_MCP_KEY" in mcpServers|servers) ;; *) die "--cursor-mcp must be mcpServers|servers" ;; esac
case "$MANY" in ''|*[!0-9]*) die "--many must be a number" ;; esac

# --- safety: never inside the repo, never $HOME itself ---------------------
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
REPO="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel 2>/dev/null || true)"
PARENT="$(dirname "$TARGET")"
[ -d "$PARENT" ] || die "parent dir does not exist: $PARENT"
ROOT="$(cd "$PARENT" && pwd -P)/$(basename "$TARGET")"
[ -z "$REPO" ] || REPO="$(cd "$REPO" && pwd -P)"
outside_repo() { [ -z "$REPO" ] || case "$ROOT/" in "$REPO/"*) die "target must be outside the repo ($REPO)" ;; esac; }
outside_repo
[ "$ROOT" != "$(cd ~ && pwd -P)" ] || die "target must not be your home directory"
P="$ROOT/project"
H="$ROOT/fake-home"
if [ -e "$P" ] || [ -e "$H" ]; then
  [ "$FORCE" -eq 1 ] || die "$ROOT already has project/ or fake-home/ (use --force to rebuild)"
  rm -rf "$P" "$H"
fi
mkdir -p "$P"; ROOT="$(cd "$ROOT" && pwd -P)"; outside_repo; P="$ROOT/project"; H="$ROOT/fake-home"

# render NAME MARKER < template  (templates use quoted heredocs; no shell expansion)
render() { sed -e "s|__NAME__|$1|g" -e "s|__MARKER__|$2|g" -e "s|__ROOT__|$P|g"; }

STAGE="$(mktemp -d "${TMPDIR:-/tmp}/tsh-spike-stage.XXXXXX")"
trap 'rm -rf "$STAGE"' EXIT
S="$STAGE/skills"

# --- skills (canonical rendering, shared by .agents and .claude) -----------
mkdir -p "$S/tsh-spike-knowledge"
render tsh-spike-knowledge SKILL-KNOWLEDGE-M1 > "$S/tsh-spike-knowledge/SKILL.md" <<'EOF'
---
name: __NAME__
description: Spike knowledge skill that reveals a marker token. Use when asked for the spike knowledge marker.
license: MIT
compatibility: "Requires MCP servers: tsh.spike-marker"
metadata:
  short-description: "Spike knowledge marker (short)"
---
<!-- Generated fixture. Do not edit. -->
# __NAME__

When this skill is loaded, print exactly: `SKILL-LOADED: __MARKER__`
EOF

mkdir -p "$S/tsh-spike-internal"
render tsh-spike-internal SKILL-INTERNAL-M3 > "$S/tsh-spike-internal/SKILL.md" <<'EOF'
---
name: __NAME__
description: "Internal step of /tsh-spike-loader: load only when a tsh command or orchestrator instructs it."
user-invocable: false
---
# __NAME__

When this skill is loaded, print exactly: `INTERNAL-LOADED: __MARKER__`
EOF

mkdir -p "$S/tsh-spike-command/agents"
render tsh-spike-command SKILL-COMMAND-M4 > "$S/tsh-spike-command/SKILL.md" <<'EOF'
---
name: __NAME__
description: Spike command that prints its marker and the arguments it received.
disable-model-invocation: true
argument-hint: "<any text>"
compatibility: "Requires MCP servers: tsh.spike-marker"
metadata:
  short-description: "Spike command"
---
# __NAME__

Print exactly two lines:
`COMMAND-MARKER: __MARKER__`
`ARGS-RECEIVED: <the user's input after the command, verbatim, or NONE>`
EOF
cat > "$S/tsh-spike-command/agents/openai.yaml" <<'EOF'
policy:
  allow_implicit_invocation: false
EOF

mkdir -p "$S/tsh-spike-loader/agents"
render tsh-spike-loader SKILL-LOADER-M5 > "$S/tsh-spike-loader/SKILL.md" <<'EOF'
---
name: __NAME__
description: Spike command that loads other skills by name.
disable-model-invocation: true
---
# __NAME__

1. Print `LOADER-MARKER: __MARKER__`.
2. Load the `tsh-spike-knowledge` skill by name (do not open any file by path) and follow it.
3. Load the `tsh-spike-internal` skill by name (do not open any file by path) and follow it.
4. Print `LOAD-METHOD: <how you loaded them: skill tool / file read / other>`.
EOF
cp "$S/tsh-spike-command/agents/openai.yaml" "$S/tsh-spike-loader/agents/openai.yaml"

mkdir -p "$S/tsh-spike-delegate/agents"
render tsh-spike-delegate SKILL-DELEGATE-M6 > "$S/tsh-spike-delegate/SKILL.md" <<'EOF'
---
name: __NAME__
description: Spike command that delegates to the named custom subagent tsh-spike-context-engineer.
disable-model-invocation: true
---
# __NAME__

1. Print `DELEGATE-MARKER: __MARKER__`.
2. Delegate to the `tsh-spike-context-engineer` custom subagent (not a generic agent). Pass exactly this prompt, verbatim, keeping `MODE: delegated` as its first line:

```
MODE: delegated
CALLER: tsh-spike-delegate
TASK: Report your markers.
```

3. Show the subagent's complete reply verbatim.
EOF
cp "$S/tsh-spike-command/agents/openai.yaml" "$S/tsh-spike-delegate/agents/openai.yaml"

i=1
while [ "$i" -le "$MANY" ]; do
  n="$(printf '%02d' "$i")"
  mkdir -p "$S/tsh-spike-filler-$n"
  render "tsh-spike-filler-$n" "FILLER-$n" > "$S/tsh-spike-filler-$n/SKILL.md" <<'EOF'
---
name: __NAME__
description: Filler skill used to measure the skill listing budget. It describes a fictional workflow in deliberately verbose terms so that the combined description length of many skills exceeds typical listing limits; it covers planning, drafting, reviewing, revising, validating, documenting and handing over a fictional artifact with several checkpoints. Use when asked for __MARKER__. DESC-TAIL-__MARKER__
metadata:
  short-description: "SHORT-__MARKER__"
---
# __NAME__

Print `__MARKER__`.
EOF
  i=$((i + 1))
done

# --- skill trees per variant -----------------------------------------------
mkdir -p "$P/.agents" "$P/.claude/skills"
cp -R "$S" "$P/.agents/skills"
case "$VARIANT" in
  copies) cp -R "$S/." "$P/.claude/skills/" ;;
  symlinks)
    for d in "$S"/*; do ln -s "../../.agents/skills/$(basename "$d")" "$P/.claude/skills/$(basename "$d")"; done ;;
  differing)
    cp -R "$S/." "$P/.claude/skills/"
    sed -e 's|SKILL-KNOWLEDGE-M1|SKILL-KNOWLEDGE-CLAUDE-VARIANT-M2|' \
        -e 's|^description: Spike knowledge skill|description: (Claude-tree variant) Spike knowledge skill|' \
        "$S/tsh-spike-knowledge/SKILL.md" > "$P/.claude/skills/tsh-spike-knowledge/SKILL.md" ;;
esac
# Exists only in .claude/skills: shows whether Cursor's third-party import is on.
mkdir -p "$P/.claude/skills/tsh-spike-claude-only"
render tsh-spike-claude-only SKILL-CLAUDE-ONLY-M7 > "$P/.claude/skills/tsh-spike-claude-only/SKILL.md" <<'EOF'
---
name: __NAME__
description: Spike skill present only in .claude/skills. Use when asked for the claude-only marker.
---
Print `CLAUDE-ONLY-SKILL: __MARKER__`
EOF

# --- agents ------------------------------------------------------------------
agent_body() { render "$1" "$2" <<'EOF'
Required skills: load `tsh-spike-knowledge` by name before starting.

You are the spike agent __NAME__.

Always start your reply with exactly these lines:
FIRST-LINE-ECHO: <the first line of the task you received, copied verbatim>
AGENT-MARKER: __MARKER__
SKILL-LOADED: <the marker printed by tsh-spike-knowledge, or NONE if you could not load it>
SKILLS-VISIBLE: <comma-separated names of the skills you can see, or NONE>

If the task contains WRITE-TEST: try to create the file __ROOT__/sandbox-probe.txt and report WRITE-RESULT: OK or WRITE-RESULT: DENIED <error>.
If the task contains SPAWN-TEST: try to spawn the tsh-spike-architect subagent with the task "nested spawn check", then report NESTED-SPAWN: OK <its AGENT-MARKER> or NESTED-SPAWN: FAILED <reason>.

If the first line of the task is exactly `MODE: delegated`: never ask questions, and end with a fenced block containing `STATUS: DONE` and `SUMMARY: <one line>`.
Otherwise (interactive mode): ask the user "Which colour should I use?" and stop. When the answer arrives, reply `INTERACTIVE-TURN-2: <answer> (__MARKER__)`.
EOF
}
cursor_agent() { # name marker readonly(0|1) dir
  { printf -- '---\nname: %s\ndescription: Spike agent %s. Use only when explicitly asked for %s.\n' "$1" "$1" "$1"
    [ "$3" -eq 1 ] && printf 'readonly: true\n'
    printf -- '---\n'; agent_body "$1" "$2"; } > "$4/$1.md"
}
codex_agent() { # file name marker model effort sandbox
  { printf '# Spike fixture agent\nname = "%s"\ndescription = "Spike agent %s. Use only when explicitly asked for %s."\n' "$2" "$2" "$2"
    printf 'model = "%s"\n' "$4"
    [ -n "$5" ] && printf 'model_reasoning_effort = "%s"\n' "$5"
    [ -n "$6" ] && printf 'sandbox_mode = "%s"\n' "$6"
    printf 'developer_instructions = """\n'; agent_body "$2" "$3"; printf '"""\n'; } > "$P/.codex/agents/$1.toml"
}
mkdir -p "$P/.cursor/agents" "$P/.claude/agents" "$P/.codex/agents"
cursor_agent tsh-spike-context-engineer AGENT-CE-CURSOR-A1 1 "$P/.cursor/agents"
cursor_agent tsh-spike-architect AGENT-ARCH-CURSOR-A2 0 "$P/.cursor/agents"
cursor_agent tsh-spike-context-engineer AGENT-CE-CLAUDE-A3 0 "$P/.claude/agents"   # name clash with .cursor
cursor_agent tsh-spike-architect AGENT-ARCH-CLAUDE-A4 0 "$P/.claude/agents"
cursor_agent tsh-spike-claude-only AGENT-CLAUDE-ONLY-A5 0 "$P/.claude/agents"
codex_agent tsh-spike-context-engineer tsh-spike-context-engineer AGENT-CE-CODEX-A6 gpt-5.4 medium read-only
codex_agent tsh_spike_context_engineer tsh_spike_context_engineer AGENT-CE-CODEX-UNDERSCORE-A7 gpt-5.4 medium read-only
codex_agent tsh-spike-architect tsh-spike-architect AGENT-ARCH-CODEX-A8 gpt-5.4 high ""
codex_agent tsh-spike-fast tsh-spike-fast AGENT-FAST-CODEX-A9 gpt-5.4-mini "" read-only

# --- MCP ---------------------------------------------------------------------
mkdir -p "$P/tools"
cat > "$P/tools/spike-mcp.mjs" <<'EOF'
#!/usr/bin/env node
// Minimal stdio MCP server: one tool, spike_marker, returning MCP-MARKER-5T2.
import { createInterface } from 'node:readline';
const send = (m) => process.stdout.write(JSON.stringify(m) + '\n');
createInterface({ input: process.stdin }).on('line', (line) => {
  let msg; try { msg = JSON.parse(line); } catch { return; }
  if (msg.id === undefined) return;
  const ok = (result) => send({ jsonrpc: '2.0', id: msg.id, result });
  switch (msg.method) {
    case 'initialize': return ok({ protocolVersion: msg.params?.protocolVersion ?? '2025-06-18',
      capabilities: { tools: {} }, serverInfo: { name: 'tsh-spike-marker', version: '1.0.0' } });
    case 'tools/list': return ok({ tools: [{ name: 'spike_marker', description: 'Returns the spike MCP marker.',
      inputSchema: { type: 'object', properties: {} } }] });
    case 'tools/call': return ok({ content: [{ type: 'text', text: 'MCP-MARKER-5T2' }] });
    case 'ping': return ok({});
    default: return send({ jsonrpc: '2.0', id: msg.id, error: { code: -32601, message: 'Method not found' } });
  }
});
EOF
chmod +x "$P/tools/spike-mcp.mjs"
# No root .mcp.json on purpose: Cursor might read it via third-party compat and mask the `servers` bug.
cat > "$P/.cursor/mcp.json" <<EOF
{
  "$CURSOR_MCP_KEY": {
    "tsh.spike-marker": { "command": "node", "args": ["$P/tools/spike-mcp.mjs"] }
  }
}
EOF
cat > "$P/.codex/config.toml" <<EOF
[mcp_servers."tsh.spike-marker"]
command = "node"
args = ["$P/tools/spike-mcp.mjs"]

[mcp_servers."spike.http-context7"]
url = "https://mcp.context7.com/mcp"
EOF

# --- root instructions + a Claude hook (third-party toggle probe) -----------
printf '@AGENTS.md\n' > "$P/CLAUDE.md"
cat > "$P/AGENTS.md" <<'EOF'
# Spike fixture

The spike codeword is AGENTS-MD-MARKER-7Q4 and this sentence exists exactly once on disk.
EOF
cat > "$P/.claude/settings.json" <<'EOF'
{ "hooks": { "UserPromptSubmit": [ { "hooks": [ { "type": "command",
  "command": "date >> \"${CLAUDE_PROJECT_DIR:-.}/.spike-claude-hook-fired\"" } ] } ] } }
EOF
printf '.spike-claude-hook-fired\nsandbox-probe.txt\n' > "$P/.gitignore"

# --- legacy layout (B1): dangling symlinks, only inside $ROOT ---------------
if [ "$LEGACY" -eq 1 ]; then
  OLD="$ROOT/old-clone/.cursor/skills"   # never created, so every link dangles
  mkdir -p "$H/.cursor/skills" "$P/.cursor/skills"
  ln -s "$OLD/commands/tsh-spike-legacy-command" "$H/.cursor/skills/tsh-spike-legacy-command"
  ln -s "$OLD/agents/tsh-spike-legacy-architect" "$H/.cursor/skills/tsh-spike-legacy-architect"
  ln -s "$OLD/workflows/tsh-spike-legacy-workflow" "$P/.cursor/skills/tsh-spike-legacy-workflow"
fi

# --- git (Codex prefers a git repo; commit keeps symlinks visible) ----------
if command -v git >/dev/null 2>&1; then
  git -C "$P" init -q
  git -C "$P" add -A
  git -C "$P" -c user.name=spike -c user.email=spike@example.invalid commit -qm "spike fixture ($VARIANT)"
fi

echo "Fixture ready: $P (variant=$VARIANT, cursor-mcp=$CURSOR_MCP_KEY, fillers=$MANY, legacy=$LEGACY)"
[ "$LEGACY" -eq 1 ] && echo "Fake HOME: $H"
exit 0
