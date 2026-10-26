# Stabilize snippet

Fixed, reviewed snippet. Paste the code block below verbatim as the `run-code` argument, once per page before capture. Do not edit or compose it. It emulates reduced motion and waits for the load state and network idle, bounded by a timeout so that long-polling pages do not hang the run.

```js
// snippet: stabilize v1
async page => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForLoadState('load');
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
}
```
