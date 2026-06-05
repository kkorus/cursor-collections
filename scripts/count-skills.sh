#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKILLS="${ROOT}/.cursor/skills"

count_dirs() {
  find "$1" -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' '
}

agents=$(count_dirs "${SKILLS}/agents")
commands=$(count_dirs "${SKILLS}/commands")
workflows=$(count_dirs "${SKILLS}/workflows")
internal=$(count_dirs "${SKILLS}/internal")

echo "Cursor Collections skill counts"
echo "  agents:    ${agents}"
echo "  commands:  ${commands}"
echo "  workflows: ${workflows}"
echo "  internal:  ${internal}"
echo "  total:     $((agents + commands + workflows + internal))"
