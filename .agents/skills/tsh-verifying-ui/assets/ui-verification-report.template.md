## Verification Result: [PASS | FAIL | VERIFICATION NOT RUN]

### Component: [name]

**Confidence:** [HIGH | MEDIUM | LOW]

### Sources

- Figma URL: [exact URL or UNKNOWN]
- Figma node id / version: [node id and version or last-modified value as fetched in this iteration, or UNKNOWN]
- Verified page URL: [exact full URL or UNKNOWN]

### Artifact Directory

- Path: [exact `ITERATION_DIR` path or UNKNOWN]

### Artifact Status

| Artifact             | Status                    | Path or blocker   |
| -------------------- | ------------------------- | ----------------- |
| actual.png           | [present/missing/blocked] | [path or blocker] |
| computed-styles.json | [present/missing/blocked] | [path or blocker] |
| a11y-snapshot.yml    | [present/missing/blocked] | [path or blocker] |

### Differences

| Property | Expected (Figma) | Actual (Implementation) | Severity   |
| -------- | ---------------- | ----------------------- | ---------- |
| [prop]   | [expected]       | [actual]                | [severity] |

List ALL differences across ALL verification categories, including lower-severity items when critical ones exist.

### Clarification Needed

- [content/data/state differences that may be intentional, with the question whether they should match Figma exactly]

Keep the result `FAIL` until the user confirms; do not move these items to Recommended Fixes before that.

### Blocker Resolution

- Blocker Type: [none or specific blocker]
- Blocking Step: [workflow step number or NONE]
- User asked: [yes/no]
- Next Required Action: [specific next step]

### Recommended Fixes

- [specific fix with exact values]

### Re-verify After Fix

After any fix, discard the stale artifacts, capture again and run a fresh verification pass before deciding PASS or FAIL.
