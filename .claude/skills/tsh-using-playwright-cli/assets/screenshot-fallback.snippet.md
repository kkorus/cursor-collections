# Screenshot fallback snippet

Fixed, reviewed snippet. Use it only if the plain `playwright-cli screenshot --filename=<path>` command failed. Paste the code block below as the `run-code` argument. Do not edit or compose it. The only permitted substitution is replacing the literal token `OUTPUT_PNG_PATH` with the explicit artifact file path of the current iteration; no other text changes.

```js
// snippet: screenshot-fallback v1
async page => {
  await page.screenshot({ path: 'OUTPUT_PNG_PATH', fullPage: true });
}
```
