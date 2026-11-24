# Storage Management

## Contents

- Storage state
- Cookies
- Local storage
- Session storage
- IndexedDB
- Common patterns
- Security notes

Manage cookies, localStorage, sessionStorage, and browser storage state. Sessions run in memory by default, which is the safer mode: nothing is written to disk unless you save a state file.

## Storage State

Save and restore complete browser state including cookies and storage.

### Save Storage State

Create the file first with `mktemp` (never `mktemp -u`, which only reserves a name without creating the file), keep it outside the working tree, and restrict it to the owner immediately after the write:

```bash
STATE_FILE="$(mktemp /tmp/playwright-state-XXXXXX.json)"
playwright-cli state-save "$STATE_FILE"
chmod 600 "$STATE_FILE"
```

### Restore Storage State

```bash
# Load storage state from the file
playwright-cli state-load "$STATE_FILE"

# Navigate to apply cookies
playwright-cli open https://example.com
```

Delete the file when the work is done:

```bash
rm -f "$STATE_FILE"
```

### Storage State File Format

The saved file contains cookies and per-origin localStorage. Treat it as a credential:

```json
{
  "cookies": [
    {
      "name": "session_id",
      "value": "abc123",
      "domain": "example.com",
      "path": "/",
      "expires": 1893456000,
      "httpOnly": true,
      "secure": true,
      "sameSite": "Lax"
    }
  ],
  "origins": [
    {
      "origin": "https://example.com",
      "localStorage": [
        { "name": "theme", "value": "dark" }
      ]
    }
  ]
}
```

## Cookies

```bash
# List all cookies, optionally filtered
playwright-cli cookie-list
playwright-cli cookie-list --domain=example.com
playwright-cli cookie-list --path=/api

# Get one cookie
playwright-cli cookie-get session_id

# Set a cookie (test fixtures only, never to fake a signed-in state)
playwright-cli cookie-set theme dark
playwright-cli cookie-set theme dark --domain=example.com --path=/ --secure --sameSite=Lax

# Delete one cookie or clear all
playwright-cli cookie-delete session_id
playwright-cli cookie-clear
```

## Local Storage

```bash
playwright-cli localstorage-list
playwright-cli localstorage-get token
playwright-cli localstorage-set theme dark
playwright-cli localstorage-set user_settings '{"theme":"dark","language":"en"}'
playwright-cli localstorage-delete token
playwright-cli localstorage-clear
```

## Session Storage

```bash
playwright-cli sessionstorage-list
playwright-cli sessionstorage-get form_data
playwright-cli sessionstorage-set step 3
playwright-cli sessionstorage-delete step
playwright-cli sessionstorage-clear
```

## IndexedDB

IndexedDB has no dedicated command. Reading it needs `run-code`, which is not allowed while a session is authenticated. See [running-code.md](running-code.md) for the general form.

## Common Patterns

### Reuse a real login

Log in once through the application's real sign-in form (in a headed window when the sign-in uses SSO or MFA), save the state to a `mktemp` file, and load it in later runs instead of logging in again:

```bash
STATE_FILE="$(mktemp /tmp/playwright-state-XXXXXX.json)"
playwright-cli -s=login open https://app.example.com/login --headed
# ... the user (or the documented credential flow) completes the login ...
playwright-cli -s=login state-save "$STATE_FILE"
chmod 600 "$STATE_FILE"
playwright-cli -s=login close

# later
playwright-cli -s=work state-load "$STATE_FILE"
playwright-cli -s=work open https://app.example.com/dashboard
```

Never hand-write cookies, tokens, `localStorage` or `sessionStorage` to fake a signed-in state; use a state file created from a real login.

## Security Notes

- Never commit storage state files; they contain auth tokens. Keep them outside the working tree and outside artifact directories.
- If a state file must live inside a project, ignore it with rules that match the filenames you use, for example `auth.json`, `*-auth.json`, `*auth-state.json`, `*session.json` and `storage-state-*.json`.
- Delete state files after the automation completes, on success and on failure.
- Use a per-run unique path from `mktemp`, never a fixed `/tmp` path or `mktemp -u`: a predictable filename is vulnerable to symlink and TOCTOU attacks.
- Set owner-only permissions with `chmod 600 "$STATE_FILE"` immediately after `state-save`, before any other command can read the file.
- Sessions are in memory by default; avoid `--persistent` unless asked.
- Never print secrets or the environment.
