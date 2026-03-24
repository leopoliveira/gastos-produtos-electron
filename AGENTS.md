# AGENTS.md

## Purpose And Scope

This file defines how LLM agents must work in this Electron project.

Agents are expected to:

- preserve Electron security defaults and strengthen them when touching related code
- avoid regressions in startup time, renderer responsiveness, memory use, and package size
- prefer small, explicit bridges between the main process and the renderer
- make repo-specific decisions instead of applying generic web-app patterns blindly

This project currently uses:

- Electron Forge
- Vite
- TypeScript
- ASAR packaging
- `@electron-forge/plugin-fuses`

This is a desktop app, not a general browser shell. Treat every new capability as a security-sensitive change.

## Project Baseline

Agents should assume the intended architecture is:

- `main` owns app lifecycle, windows, privileged OS access, menus, protocol registration, and IPC handlers
- `preload` is the only bridge between renderer code and privileged capabilities
- `renderer` is untrusted UI code, even when the source is local

Current repo facts that matter:

- Fuse hardening is already enabled in [`forge.config.ts`](C:/Users/ldpo9/Documents/Projetos/gastos-produtos-electron/forge.config.ts)
- The current `webPreferences` in [`main-window.ts`](C:/Users/ldpo9/Documents/Projetos/gastos-produtos-electron/src/main/windows/main-window.ts) explicitly set `preload`, `contextIsolation: true`, `nodeIntegration: false`, and `sandbox: true`
- The current window setup is split between [`index.ts`](C:/Users/ldpo9/Documents/Projetos/gastos-produtos-electron/src/main/index.ts) and [`main-window.ts`](C:/Users/ldpo9/Documents/Projetos/gastos-produtos-electron/src/main/windows/main-window.ts), with IPC handler registration and SQLite initialization happening during app startup
- The current HTML in [`index.html`](C:/Users/ldpo9/Documents/Projetos/gastos-produtos-electron/src/renderer/index.html) already defines a CSP and agents must preserve or tighten it when renderer assets change
- The current preload in [`index.ts`](C:/Users/ldpo9/Documents/Projetos/gastos-produtos-electron/src/preload/index.ts) exposes a single `window.appApi` bridge backed by typed IPC channels in [`src/shared/ipc.ts`](C:/Users/ldpo9/Documents/Projetos/gastos-produtos-electron/src/shared/ipc.ts)
- The current backend persistence is local SQLite, initialized in [`database.ts`](C:/Users/ldpo9/Documents/Projetos/gastos-produtos-electron/src/main/backend/infra/sqlite/database.ts), with versioned migrations in [`migrations.ts`](C:/Users/ldpo9/Documents/Projetos/gastos-produtos-electron/src/main/backend/infra/sqlite/migrations.ts)
- The current renderer service layer calls the preload bridge via helpers such as [`electron-api.ts`](C:/Users/ldpo9/Documents/Projetos/gastos-produtos-electron/src/renderer/services/electron-api.ts) and service modules under [`src/renderer/services/`](C:/Users/ldpo9/Documents/Projetos/gastos-produtos-electron/src/renderer/services/)
- Main-process logging is configured in [`app-logger.ts`](C:/Users/ldpo9/Documents/Projetos/gastos-produtos-electron/src/main/logging/app-logger.ts); renderer-side log forwarding uses [`app-log.ts`](C:/Users/ldpo9/Documents/Projetos/gastos-produtos-electron/src/renderer/services/app-log.ts) and [`logging-ipc.ts`](C:/Users/ldpo9/Documents/Projetos/gastos-produtos-electron/src/main/ipc/logging-ipc.ts). See [Logging Pattern](#logging-pattern).

When agents add features, they must move the project toward a stricter Electron posture, not away from it.

## Hard Security Rules

These rules are mandatory unless the user explicitly approves a justified exception.

### Window And WebPreferences

- Always keep `contextIsolation: true`.
- Always keep `sandbox: true` unless a documented Electron limitation makes it impossible.
- Always keep `nodeIntegration: false`.
- Do not enable `enableRemoteModule`.
- Do not disable `webSecurity`.
- Do not enable `allowRunningInsecureContent`.
- Do not enable experimental Blink or Chromium features without a documented reason and risk review.
- Do not leave `devTools` enabled unconditionally in production code.

Current repo baseline for `webPreferences` in [`main-window.ts`](C:/Users/ldpo9/Documents/Projetos/gastos-produtos-electron/src/main/windows/main-window.ts):

```ts
webPreferences: {
  preload: path.join(__dirname, 'preload.js'),
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: true,
}
```

Preferred hardened direction for future changes:

```ts
webPreferences: {
  preload: path.join(__dirname, 'preload.js'),
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: true,
  devTools: !app.isPackaged,
}
```

### IPC Design

- Expose capabilities, not raw modules.
- Never expose `ipcRenderer`, `shell`, `fs`, `path`, or arbitrary Electron/Node objects directly to the renderer.
- Use `contextBridge.exposeInMainWorld()` with a narrow, typed surface.
- Treat IPC as the app's internal API boundary between renderer and main.
- Keep channel names centralized in [`src/shared/ipc.ts`](C:/Users/ldpo9/Documents/Projetos/gastos-produtos-electron/src/shared/ipc.ts).
- Keep renderer-side API access behind small helpers such as [`electron-api.ts`](C:/Users/ldpo9/Documents/Projetos/gastos-produtos-electron/src/renderer/services/electron-api.ts), not ad hoc `window.appApi` access spread through components.
- Validate every IPC payload.
- Validate the sender for IPC messages that can mutate state, access files, or trigger OS behavior.
- Prefer `ipcMain.handle`/`ipcRenderer.invoke` for request-response flows.
- Avoid sync IPC.
- Normalize domain errors in `main` and rethrow renderer-safe error objects from `preload`; do not leak raw stack traces or database errors across the bridge.
- Prefer one handler module per bounded backend surface, with payload guards close to the handler registration.

Preferred preload shape:

```ts
contextBridge.exposeInMainWorld('appApi', {
  getAppVersion: () => ipcRenderer.invoke('app:get-version'),
  openReport: (reportId: string) => ipcRenderer.invoke('reports:open', { reportId }),
});
```

Do not do this:

```ts
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer,
  shell,
});
```

### Database And Persistence

- Treat the SQLite database as a privileged main-process concern.
- Do not access SQLite directly from the renderer or preload.
- Keep schema creation and migration application in startup-safe infrastructure under [`src/main/backend/infra/sqlite/`](C:/Users/ldpo9/Documents/Projetos/gastos-produtos-electron/src/main/backend/infra/sqlite/).
- Keep migrations versioned, append-only, and explicit. Do not silently rewrite already-applied migrations.
- Default database location is Electron `userData/App_Data/gastos.db`; preserve that convention unless the user explicitly asks to change it.
- Prefer async database APIs and short transactions.
- Keep SQL focused and readable; avoid introducing an ORM without a repo-specific reason.
- Preserve the current domain behavior when changing persistence: soft delete, exact error messages where UX depends on them, and recipe snapshot semantics for ingredients and packings.
- Schema or migration changes must be reflected in tests that exercise real SQLite behavior.

### Navigation, External Content, And Remote Data

- Prefer local app content over remote content.
- If remote content is ever introduced, use HTTPS only.
- Deny unexpected navigation.
- Deny unexpected window creation.
- Treat `shell.openExternal()` as sensitive. Only allow trusted, validated URLs.
- Do not add `<webview>` unless the user explicitly needs it and the security tradeoff is documented.
- Prefer custom protocols over `file://` when the app grows beyond the starter template.

Recommended guards:

```ts
mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

mainWindow.webContents.on('will-navigate', (event) => {
  event.preventDefault();
});
```

If some navigation must be allowed, validate exact origins and routes instead of using broad allowlists.

### Content Security Policy

- Add and maintain a restrictive CSP.
- Default target is local scripts only.
- Avoid `unsafe-inline` and `unsafe-eval`.
- If development tooling requires a temporary relaxation, scope it to development mode only and document it.

Minimum direction for local UI:

```html
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"
/>
```

Agents should tighten this further when the renderer architecture allows it.

### Dependencies, Packaging, And Release Hygiene

- Prefer fewer dependencies.
- Reject dependencies that only save a few lines but expand attack surface.
- Keep Electron current when practical; outdated Electron versions carry Chromium and Node security risk.
- Preserve and extend fuse hardening in [`forge.config.ts`](C:/Users/ldpo9/Documents/Projetos/gastos-produtos-electron/forge.config.ts).
- Do not disable `OnlyLoadAppFromAsar` or ASAR integrity validation without a documented reason.

When evaluating a dependency or Electron upgrade, consider both runtime risk and bundle/startup cost.

## Hard Performance Rules

These rules are also mandatory.

### Startup

- Do not do heavy work during app startup unless it is required for first paint.
- Defer non-critical setup until after the first window is shown or after the relevant user action.
- Do not import large modules in `main` or `preload` unless they are needed immediately.
- Lazy-load feature code where it reduces startup cost.

### Main Process

- Never block the main process with synchronous filesystem, child process, or CPU-heavy work.
- Prefer async Node APIs.
- Move CPU-heavy work off the main thread.
- Use worker threads, utility processes, or separate processes when justified.

### Renderer

- Keep the renderer responsive.
- Avoid long synchronous work on input, render, or navigation paths.
- Break up heavy work with scheduling or background execution.
- Load only the code needed for the active screen.
- Avoid shipping large libraries to the renderer if the capability can live in `main`.

### Preload

- Keep preload tiny and deterministic.
- Preload is not a second main process.
- Do not put business logic, database access, or large dependency graphs in preload.
- Preload should mostly validate, bridge, and normalize data crossing the trust boundary.

### Windows, Views, And Memory

- Create windows only when needed.
- Reuse a window when that produces a simpler lifecycle and lower memory cost.
- Clean up listeners, timers, intervals, and references when windows close.
- Avoid background work in hidden windows unless the feature requires it.

### Profiling And Optimization Discipline

- Measure before and after significant performance changes.
- Use Chrome DevTools and Electron profiling tools when investigating startup, long tasks, or memory growth.
- Do not cargo-cult optimizations.
- Prefer the simplest design that meets the need with fewer processes, less IPC chatter, and smaller dependency graphs.

## Repo-Specific Implementation Patterns

Agents should follow these patterns in this repository.

### `src/main/`

- Keep app lifecycle and process-wide wiring in [`index.ts`](C:/Users/ldpo9/Documents/Projetos/gastos-produtos-electron/src/main/index.ts).
- Keep `BrowserWindow` creation and window-specific behavior in [`main-window.ts`](C:/Users/ldpo9/Documents/Projetos/gastos-produtos-electron/src/main/windows/main-window.ts).
- Keep backend persistence, migrations, and other privileged infrastructure under [`src/main/backend/`](C:/Users/ldpo9/Documents/Projetos/gastos-produtos-electron/src/main/backend/).
- Preserve the current `webPreferences` baseline: `preload`, `contextIsolation: true`, `nodeIntegration: false`, and `sandbox: true`.
- Gate dev-only behavior with `app.isPackaged` or equivalent.
- Do not leave `mainWindow.webContents.openDevTools()` unconditional.
- Register navigation and window-creation guards near window setup.
- Keep startup code small; move feature logic into focused modules when the file grows.
- Startup may initialize the local database and register IPC handlers, but do not add unrelated heavy work before first window creation.

Recommended direction:

```ts
if (!app.isPackaged) {
  mainWindow.webContents.openDevTools({ mode: 'detach' });
}
```

### `src/main/backend/`

- `application/` owns backend use cases and business-flow orchestration.
- `domain/` owns entities, invariants, and backend-specific errors.
- `infra/sqlite/` owns database bootstrap, migration execution, and low-level persistence helpers.
- Do not put Electron window code in backend modules.
- Do not put renderer formatting or UI-specific view logic in backend modules.
- If a change adds a new persisted capability, define the domain contract first, then wire persistence, then expose it through IPC.

### `src/preload/index.ts`

- Expose one minimal API namespace.
- Keep the exported surface typed and explicit.
- Bridge only the methods the renderer actually needs.
- Keep error normalization in preload small and deterministic.
- Do not duplicate backend validation or business rules in preload.

### `src/renderer/index.ts` And Renderer UI

- Treat all data from preload as untrusted input that still needs app-level validation.
- Keep renderer modules split by feature as the UI grows.
- Avoid hidden side effects at module import time.
- Avoid large startup-only imports when the screen can render first and enhance later.
- Prefer calling domain service wrappers in [`src/renderer/services/`](C:/Users/ldpo9/Documents/Projetos/gastos-produtos-electron/src/renderer/services/) instead of reaching into `window.appApi` directly from components.
- Treat `window.appApi` as the renderer's internal API client, analogous to an HTTP client in a web app.
- Do not add new renderer features on top of the legacy HTTP helpers when the capability already exists over IPC.
- Keep CSS and styling co-located with the component or page that owns the UI whenever possible.
- Prefer `*.module.css` for component- and page-scoped styles.
- Keep [`index.css`](C:/Users/ldpo9/Documents/Projetos/gastos-produtos-electron/src/renderer/styles/index.css) limited to app-wide imports plus truly global concerns such as tokens, resets, shared layout primitives, and a small set of reusable utility or form styles.
- Put shared renderer-wide CSS in focused files under [`src/renderer/styles/`](C:/Users/ldpo9/Documents/Projetos/gastos-produtos-electron/src/renderer/styles/) such as tokens, base, and layout, instead of growing one catch-all stylesheet.
- Do not add component selectors to global styles when a CSS Module can express the same rule.
- Keep responsive rules with the same owner as the base rule. If a component uses a CSS Module, its media queries belong in that module too.
- When a style block is only used by one feature route, move it into that feature folder instead of keeping it in global CSS.
- Prefer explicit class composition over broad descendant selectors that couple one feature to another feature's stylesheet.

### `src/renderer/index.html`

- Maintain a CSP.
- Keep the shell minimal.
- Do not inject remote scripts.

### `src/shared/`

- Place cross-process constants, types, IPC contracts, and pure utilities here.
- Do not put Electron-specific APIs or renderer-only UI concerns in this layer.
- Shared DTOs and IPC payload contracts should be stable enough for both preload and renderer consumers.
- If a backend contract changes, update the shared type first and then adjust `preload`, `main`, renderer services, and tests consistently.

### Currency input (BRL)

- Product and packing **Preço** and recipe **Preço de Venda da Unidade** use [`CurrencyMaskedInput`](C:/Users/ldpo9/Documents/Projetos/gastos-produtos-electron/src/renderer/components/currency-masked-input.tsx) (`type="text"`, `inputMode="numeric"`); do not use `type="number"` for those monetary fields.
- Pure conversions live in [`currency-input.ts`](C:/Users/ldpo9/Documents/Projetos/gastos-produtos-electron/src/shared/currency-input.ts): `amountFromCurrencyDigitString`, `currencyDigitStringFromAmount`, `formatCurrencyMaskedDisplay`. Display must stay consistent with [`format.ts`](C:/Users/ldpo9/Documents/Projetos/gastos-produtos-electron/src/shared/format.ts) (`formatCurrency`, `pt-BR`).
- Form state keeps a **digits-only string** meaning centavos typed in order (e.g. `450` → R$ 4,50 → JavaScript number `4.5` for services and IPC). Seed that string when editing with `currencyDigitStringFromAmount(storedAmount)`.
- Reuse this component and shared helpers for new BRL price fields; avoid ad hoc masks or duplicate parsing in pages.
- In renderer tests, target these controls with `getByRole('textbox', { name: ... })` (not `spinbutton`). Simulate input with `fireEvent.change` and a digit-only `value`: the string is the centavos sequence (e.g. R$ 25,00 → `2500`, R$ 8,00 → `800`).

### API And Service Calls

- For this repository, prefer IPC-backed service calls over HTTP for app features.
- Renderer service modules should encapsulate CRUD flows and any read-after-write fetches needed by the UI.
- Keep transport concerns in service helpers, not inside React pages or components.
- If a temporary HTTP client remains for legacy or migration reasons, keep it isolated and do not expand its footprint without a documented reason.
- New feature work should usually follow this chain: `shared contract` -> `main backend service` -> `IPC handler` -> `preload bridge` -> `renderer service` -> `UI`.

### `tests/`

- Keep test code outside `src/`.
- Prefer mirroring the production structure as tests are added.
- Prefer real SQLite-backed tests for persistence and migration behavior.
- Keep IPC tests focused on sender validation, payload validation, and serialized error behavior.
- Keep renderer tests focused on service contracts and UI behavior, not main-process internals.

### `assets/`

- Store non-code static assets here unless a build step requires a more specific location.

### `forge.config.ts`

- Keep fuse hardening enabled.
- When packaging behavior changes, evaluate impact on security and startup time.
- If a future feature requires a weaker setting, document the reason directly in the config change.

## Logging Pattern

Observability uses [`electron-log`](https://github.com/megahertz/electron-log) in the **main process** only. The renderer never loads `electron-log`; it forwards structured entries through a narrow IPC channel so file transport and levels stay centralized.

### Main process

- Call [`configureMainProcessLogging()`](C:/Users/ldpo9/Documents/Projetos/gastos-produtos-electron/src/main/logging/app-logger.ts) once at main entry (before `app.whenReady()`), as in [`index.ts`](C:/Users/ldpo9/Documents/Projetos/gastos-produtos-electron/src/main/index.ts).
- Import the shared instance as `mainLog` from [`app-logger.ts`](C:/Users/ldpo9/Documents/Projetos/gastos-produtos-electron/src/main/logging/app-logger.ts) and use `mainLog.debug`, `info`, `warn`, and `error`.
- Default configuration: file transport at **info**; console at **warn** when packaged and **debug** when not. In packaged builds, file logs are written under a `logs/` directory next to the app executable (see `applyInstallAdjacentFileTransport` in `app-logger.ts`).
- Prefer **structured context** as a trailing object (e.g. `{ productId, name }`) instead of long interpolated strings, so logs stay grep-friendly and safe to parse.

### Message prefixes

Use a stable bracket prefix on the first argument so operators can filter:

| Prefix | Use |
| --- | --- |
| `[backend]` | Process-wide backend wiring (e.g. services cache initialized). |
| `[backend:sqlite]` | Database open/close, migration applied or failed. |
| `[backend:products]`, `[backend:packings]`, `[backend:groups]`, `[backend:recipes]` | Domain service mutations and important business outcomes (e.g. soft-delete, blocked delete). |
| `[ipc]` | Main IPC handler errors or diagnostics (see [`backend-ipc.ts`](C:/Users/ldpo9/Documents/Projetos/gastos-produtos-electron/src/main/ipc/backend-ipc.ts)). |
| `[renderer]` | Lines forwarded from the renderer through [`logging-ipc.ts`](C:/Users/ldpo9/Documents/Projetos/gastos-produtos-electron/src/main/ipc/logging-ipc.ts). |

When adding new areas, extend the `backend:<area>` pattern rather than inventing unrelated tags.

### Backend (`src/main/backend/`)

- Log **mutations** (create, update, soft-delete) and **infra milestones** (DB open, migrations, close) at `info` unless the event is exceptional.
- Log **expected business rule blocks** (e.g. delete forbidden because of references) at `warn` before throwing domain errors.
- Log **migration failures** and similar hard failures at `error` with `{ id, error }` (or equivalent), then rethrow.
- Avoid `info` on hot **read** paths (`getAll`, `getById`) to limit noise and I/O.

### Renderer

- Use [`app-log.ts`](C:/Users/ldpo9/Documents/Projetos/gastos-produtos-electron/src/renderer/services/app-log.ts) (`appLog.debug`, `info`, `warn`, `error`). It invokes preload → IPC; failures are swallowed so UI flows are not broken.
- Do not log secrets, tokens, or large payloads. The main handler validates and caps message length, context key count, and string sizes (see [`logging-ipc.ts`](C:/Users/ldpo9/Documents/Projetos/gastos-produtos-electron/src/main/ipc/logging-ipc.ts)).

### Security and IPC

- Renderer log payloads are **untrusted**; keep [`assertTrustedSender`](C:/Users/ldpo9/Documents/Projetos/gastos-produtos-electron/src/main/ipc/logging-ipc.ts) aligned with other IPC handlers.
- Treat logging IPC like any other channel: no passthrough of raw objects beyond the validated `RendererLogPayload` shape in [`ipc.ts`](C:/Users/ldpo9/Documents/Projetos/gastos-produtos-electron/src/shared/ipc.ts).

### Tests

- Modules that import `mainLog` pull in Electron/electron-log. Vitest runs that touch them may emit console output from real logging; when assertions depend on log calls, mock [`app-logger`](C:/Users/ldpo9/Documents/Projetos/gastos-produtos-electron/src/main/logging/app-logger.ts) the same way as in [`backend-ipc.test.ts`](C:/Users/ldpo9/Documents/Projetos/gastos-produtos-electron/tests/main/backend-ipc.test.ts).

## Delivery Checklist

Before finishing a task, agents must verify:

- no insecure Electron flags were introduced
- `contextIsolation`, `sandbox`, and `nodeIntegration: false` remain enforced for renderer windows
- no raw Electron or Node API was exposed to the renderer
- IPC surface is narrow, typed, and validated
- SQLite access remains in `main`, not `renderer` or `preload`
- schema and migration changes are versioned and covered by tests when persistence changed
- renderer service calls still go through the intended preload/API wrapper
- navigation and external-link behavior are restricted appropriately
- no unconditional production DevTools behavior remains
- no new synchronous main-process bottleneck was introduced
- startup work is still proportional to what the first screen needs
- large dependencies were justified
- documentation or comments were updated when the security/performance model changed
- logging changes follow the [Logging Pattern](#logging-pattern): main uses `mainLog` and prefixes; renderer uses `appLog` + IPC; no secrets or unbounded payloads

## Red Flags That Require Extra Scrutiny

If a task involves any of the items below, agents should slow down, document the tradeoff, and avoid autonomous broad changes:

- enabling Node integration
- disabling sandboxing or context isolation
- loading remote content
- adding a `<webview>`
- exposing filesystem, shell, or process control to the renderer
- adding broad IPC passthrough methods
- accessing the database from preload or renderer
- bypassing shared IPC contracts with ad hoc payload shapes
- introducing a second persistence mechanism for the same feature without a migration plan
- introducing background daemons, long-running child processes, or polling loops
- using sync filesystem or sync IPC in user-visible paths
- weakening fuses or packaging protections
- loosening CSP for production

## References

This guide is grounded in Electron official guidance plus current ecosystem practice:

- Electron Security: https://www.electronjs.org/docs/latest/tutorial/security
- Electron Performance: https://www.electronjs.org/pt/docs/latest/tutorial/performance
- Electron Fuses: https://www.electronjs.org/docs/latest/tutorial/fuses

When those recommendations evolve, update this file to match the stricter safe default.

## Current CSS Pattern

Use this repository pattern unless a task has a documented reason to do otherwise:

- [`src/renderer/styles/index.css`](C:/Users/ldpo9/Documents/Projetos/gastos-produtos-electron/src/renderer/styles/index.css) should only import global style entry files.
- Global renderer styles belong in focused files under [`src/renderer/styles/`](C:/Users/ldpo9/Documents/Projetos/gastos-produtos-electron/src/renderer/styles/): [`tokens.css`](C:/Users/ldpo9/Documents/Projetos/gastos-produtos-electron/src/renderer/styles/tokens.css), [`base.css`](C:/Users/ldpo9/Documents/Projetos/gastos-produtos-electron/src/renderer/styles/base.css), and [`layout.css`](C:/Users/ldpo9/Documents/Projetos/gastos-produtos-electron/src/renderer/styles/layout.css).
- Reusable renderer UI primitives that are still shared across features should live in [`shared-ui.module.css`](C:/Users/ldpo9/Documents/Projetos/gastos-produtos-electron/src/renderer/styles/shared-ui.module.css) and be imported explicitly by consumers.
- Component styles should live beside the component, for example `components/sidebar/index.tsx` with `components/sidebar/sidebar.module.css`.
- Page or route styles should live beside the page, for example `pages/recipes/recipe-form-page.tsx` with `pages/recipes/recipe-form-page.module.css`.
- Do not reintroduce large global BEM blocks into [`index.css`](C:/Users/ldpo9/Documents/Projetos/gastos-produtos-electron/src/renderer/styles/index.css).
- If a selector is only used by one component or one route, it should not live in [`shared-ui.module.css`](C:/Users/ldpo9/Documents/Projetos/gastos-produtos-electron/src/renderer/styles/shared-ui.module.css).
- If a module owns a responsive behavior, keep the related media query in the same CSS Module.
