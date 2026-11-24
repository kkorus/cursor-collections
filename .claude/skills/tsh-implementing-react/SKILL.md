---
name: tsh-implementing-react
description: React implementation patterns covering the rules of hooks, effects and cleanup, state and composition, error boundaries, memoization with React 19 and the React Compiler, a hooks review checklist, and XSS-safe rendering with dangerouslySetInnerHTML. Use when writing or reviewing React components and hooks, fixing effect bugs, deciding whether to memoize, or rendering untrusted content.
metadata:
  short-description: React hooks, effects, memoization and safe rendering
user-invocable: false
---
<!-- Generated from src/skills/tsh-implementing-react/SKILL.md by scripts/generate.mjs. Do not edit. -->

# Implementing React

Provides the React-specific layer under the framework-agnostic frontend skills: how hooks, effects, memoization, error boundaries and raw HTML rendering work in React, and what to check when reviewing them.

<principles>

<render-is-pure>
A component body must be a pure calculation of props, state and context. Side effects belong in event handlers or effects. Pure rendering is what makes Strict Mode, concurrent rendering and the React Compiler safe to use.
</render-is-pure>

<effects-synchronize>
Use an effect only to synchronize with something outside React (network, timers, subscriptions, the DOM, third-party widgets). If no external system is involved, compute during render or handle the logic in an event handler.
</effects-synchronize>

<measure-before-memoizing>
Do not memoize by default. Memoize when a measured re-render cost or a referential-equality requirement justifies it, and prefer the React Compiler where the project has adopted it.
</measure-before-memoizing>

</principles>

## Contents

- Rules of Hooks
- Effects and Cleanup
- State, Composition and Error Boundaries
- Memoization, React 19 and the React Compiler
- Rendering Raw HTML (dangerouslySetInnerHTML and XSS)
- Hooks Review Checklist
- Anti-Patterns

## Rules of Hooks

1. Call hooks only at the top level of a function component or a custom hook. Never inside conditions, loops, early-return branches, nested functions, `try/catch/finally` blocks or class components.
2. Call hooks only from React function components or other hooks (`use` prefix).
3. Call hooks in the same order on every render. Conditional behavior goes inside the hook (an `enabled` flag, a condition inside the effect), not around the call.
4. Enforce both rules with `eslint-plugin-react-hooks` (`rules-of-hooks` as error, `exhaustive-deps` as warning or error). Treat a suppressed rule as a bug to fix.
5. The `use` API (React 19) is the exception to the ordering rules: it can be called conditionally, but still only during render inside a component or hook.

## Effects and Cleanup

### Dependency arrays

- List every reactive value (props, state, values derived from them) that the effect reads. Do not omit values to "run once".
- Avoid object, array and function literals as dependencies; they change identity every render. Lift constants to module scope, move functions into the effect, or stabilize them.
- When an effect must read the latest value without re-running, restructure it (a ref for non-rendering values, or an "effect event" helper where your React version provides one) rather than suppressing the lint rule.

### Cleanup

Every effect that creates a resource returns a cleanup function. Cleanup runs before the effect re-runs and on unmount.

```tsx
useEffect(() => {
  const controller = new AbortController();

  fetch(`/api/users/${userId}`, { signal: controller.signal })
    .then((res) => res.json())
    .then(setUser)
    .catch((error) => {
      if (error.name !== "AbortError") setError(error);
    });

  return () => controller.abort();
}, [userId]);
```

| Resource | Setup | Cleanup |
| --- | --- | --- |
| Timer | `const id = setTimeout(fn, ms)` | `clearTimeout(id)` |
| Interval | `const id = setInterval(fn, ms)` | `clearInterval(id)` |
| Event listener | `target.addEventListener(type, handler)` | `target.removeEventListener(type, handler)` |
| Request | `fetch(url, { signal })` | `controller.abort()` |
| Subscription / socket | `source.subscribe(handler)` / `new WebSocket(url)` | `unsubscribe()` / `socket.close()` |
| Third-party widget | `widget = new Lib(node)` | `widget.destroy()` |

### Strict Mode

In development, Strict Mode mounts, unmounts and re-mounts every component once, so effects run twice. An effect that breaks under this has missing or incorrect cleanup. Fix the cleanup; do not remove Strict Mode or add "already ran" guards.

### Prefer alternatives to effects

- Derived data: compute during render (`const fullName = first + " " + last`), and use `useMemo` only if the calculation is measurably expensive.
- Resetting state when a prop changes: give the component a `key`, rather than an effect that calls `setState`.
- User-triggered work (submit, click): run it in the event handler.
- Server data: use the framework's data loading or a server-cache library (TanStack Query, SWR) rather than hand-written fetch effects.
- External stores: `useSyncExternalStore`.

## State, Composition and Error Boundaries

Component composition (`children`, render props, compound components, slots), the state-type to hook mapping and the error-boundary rules live in `./references/component-patterns.md`. In short:

- Pick the simplest state tool: `useState`, then `useReducer` for related or action-based transitions, then context, then an external store.
- Error boundaries catch errors thrown while rendering. They do not catch errors in event handlers, asynchronous code or server-side rendering; handle those with `try/catch`. Use one boundary per feature area, and the `react-error-boundary` package instead of a hand-written class if the project allows the dependency.
- Throwing during render is acceptable for programmer errors (a hook used outside its provider) and for integrating with Suspense or error boundaries. Expected runtime failures (network errors, validation) are returned as state, not thrown.

## Memoization, React 19 and the React Compiler

| Tool | Use when |
| --- | --- |
| `React.memo` | A component re-renders often with unchanged props and the render is measurably expensive |
| `useMemo` | An expensive calculation, or a value whose identity matters to a memoized child or another hook's dependency list |
| `useCallback` | A function is passed to a memoized child or is a hook dependency |
| `useTransition` / `useDeferredValue` | Keeping input responsive while an expensive update renders |
| `React.lazy` + `Suspense` | Route-level and heavy component code splitting; with named exports use `lazy(() => import('./Heavy').then(m => ({ default: m.Heavy })))` |

**React Compiler.** The React Compiler is a build-time tool that automatically memoizes components and hooks that follow the Rules of React. In a project that has adopted it:

- Do not add `React.memo`, `useMemo` or `useCallback` purely for performance in new code; let the compiler handle it. Keep existing manual memoization unless you have verified removing it is safe.
- Keep components and hooks pure and keep the ESLint rules enabled; code that violates the Rules of React is skipped by the compiler, and the lint output shows where.
- Manual memoization is still valid for referential-equality needs (an effect dependency that must not change) and as an escape hatch.
- Check the installed React version and the compiler setup (Babel or bundler plugin, opt-in directives) in the project before relying on it. Supported versions and configuration options change, so read the current React Compiler documentation.

**React 19 changes that affect patterns** (confirm the project's React version first):

- `ref` is a regular prop for function components, so `forwardRef` is no longer needed in new code.
- Form Actions (`<form action={fn}>`), `useActionState`, `useFormStatus` and `useOptimistic` cover many hand-written pending and error form states.
- `use(promise)` and `use(context)` read resources during render.
- The root options `onCaughtError`, `onUncaughtError` and `onRecoverableError` report errors centrally.

## Rendering Raw HTML (dangerouslySetInnerHTML and XSS)

React escapes values rendered in JSX. `dangerouslySetInnerHTML={{ __html: html }}` bypasses that and is an XSS vector for any string that is not fully trusted.

- Prefer not to use it. Render Markdown or rich text through a component library that produces React elements.
- When it is unavoidable, sanitize the HTML with a maintained sanitizer (for example DOMPurify) immediately before rendering, with an allow-list of tags and attributes, and sanitize on the server as well where the content is stored.
- Never pass user input, URL parameters, API fields or CMS content into `__html` unsanitized. Treat "it comes from our own backend" as untrusted if any user can influence it.
- Validate URLs used in `href`, `src` and `action`: reject `javascript:` and other unexpected schemes (allow `https:`, `mailto:` and relative paths).
- Do not build HTML strings by concatenation, and avoid `ref.current.innerHTML = ...`.
- Add a Content Security Policy as defense in depth; it does not replace sanitization.
- In review, treat every `dangerouslySetInnerHTML` without visible sanitization as a critical finding.

## Hooks Review Checklist

```
React hooks review:
- [ ] Hooks are called at the top level, in the same order, only from components or hooks
- [ ] eslint-plugin-react-hooks is enabled and no rule is suppressed
- [ ] Every effect lists all reactive dependencies; no object/array/function literal dependencies
- [ ] Every effect that creates a timer, listener, subscription, request or widget returns a cleanup
- [ ] Effects survive the Strict Mode mount-unmount-mount cycle
- [ ] No effect is used for derived state, prop-change resets or user-triggered work
- [ ] No side effects, mutations or reads of mutable globals during render
- [ ] State updates use the functional form when they depend on previous state
- [ ] Custom hooks return a stable shape (object once more than two values) and are named `use...`
- [ ] Context provider values are memoized or otherwise stable
- [ ] Memoization is justified by measurement or by referential-equality needs (or left to the React Compiler)
- [ ] List keys are stable unique IDs, not array indices on dynamic lists
- [ ] Every dangerouslySetInnerHTML is sanitized, or replaced
```

## Anti-Patterns

| Anti-Pattern | Fix |
| --- | --- |
| Hook called inside a condition or loop | Move the condition inside the hook or effect |
| Missing or wrong dependency array | Include all reactive values; restructure instead of suppressing |
| `useEffect` to compute derived state | Compute during render |
| `useEffect` plus `setState` to reset on prop change | Use a `key` on the component |
| Effect without cleanup for a timer, listener or request | Return a cleanup function |
| Inline `{}` / `[]` / `() => {}` passed to a memoized child | Lift to module scope or stabilize |
| `useMemo` / `useCallback` on every value | Remove; memoize only with a reason |
| Mutating state or props directly | Create a new object or array |
| Index as key on a reorderable list | Use a stable unique ID |
| Unsanitized `dangerouslySetInnerHTML` | Sanitize, or render through React elements |
| New class components | Function components with hooks (error boundaries are the exception) |

## Connected Skills

- `tsh-implementing-frontend` — framework-agnostic component structure, design tokens and Figma workflow
- `tsh-writing-hooks` — design of custom hooks: contracts, tiers, return shapes, testing
- `tsh-optimizing-frontend` — profiling, bundle and rendering optimization
- `tsh-reviewing-frontend` — frontend review criteria that call this skill's checklist
- `tsh-implementing-forms` — form state, validation and submission patterns
- `tsh-ensuring-accessibility` — accessible components and keyboard support
