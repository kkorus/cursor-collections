# Screenshot fallback snippet

Fixed, reviewed snippet. Use it only if the plain `playwright-cli screenshot --filename=<path>` command failed. Paste the code block below as the `run-code` argument. Do not edit or compose it. The only permitted substitution is replacing the literal token `OUTPUT_PNG_PATH` with the explicit artifact file path of the current iteration; no other text changes. The path is substituted into JavaScript source, so first check it against `^[A-Za-z0-9._/-]+$` (no `..` segment); a path with a quote, backslash, space or newline is refused, never escaped. If the `screenshot` help names a full-page flag, the plain command is preferred and this snippet is not needed.

```js
// snippet: screenshot-fallback v1
async page => {
  await page.screenshot({ path: 'OUTPUT_PNG_PATH', fullPage: true });
}
```
