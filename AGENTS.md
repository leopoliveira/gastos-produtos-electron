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
- The current window setup is split between [`index.ts`](C:/Users/ldpo9/Documents/Projetos/gastos-produtos-electron/src/main/index.ts) and [`main-window.ts`](C:/Users/ldpo9/Documents/Projetos/gastos-produtos-electron/src/main/windows/main-window.ts), but is still close to the starter template in behavior and must not be treated as the final security baseline
- The current HTML in [`index.html`](C:/Users/ldpo9/Documents/Projetos/gastos-produtos-electron/src/renderer/index.html) does not yet define a CSP
- The current preload in [`index.ts`](C:/Users/ldpo9/Documents/Projetos/gastos-produtos-electron/src/preload/index.ts) is empty, which is preferable to exposing broad APIs

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
- Validate every IPC payload.
- Validate the sender for IPC messages that can mutate state, access files, or trigger OS behavior.
- Prefer `ipcMain.handle`/`ipcRenderer.invoke` for request-response flows.
- Avoid sync IPC.

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
- Preserve the current `webPreferences` baseline: `preload`, `contextIsolation: true`, `nodeIntegration: false`, and `sandbox: true`.
- Gate dev-only behavior with `app.isPackaged` or equivalent.
- Do not leave `mainWindow.webContents.openDevTools()` unconditional.
- Register navigation and window-creation guards near window setup.
- Keep startup code small; move feature logic into focused modules when the file grows.

Recommended direction:

```ts
if (!app.isPackaged) {
  mainWindow.webContents.openDevTools({ mode: 'detach' });
}
```

### `src/preload/index.ts`

- Expose one minimal API namespace.
- Keep the exported surface typed and explicit.
- Bridge only the methods the renderer actually needs.

### `src/renderer/index.ts` And Renderer UI

- Treat all data from preload as untrusted input that still needs app-level validation.
- Keep renderer modules split by feature as the UI grows.
- Avoid hidden side effects at module import time.
- Avoid large startup-only imports when the screen can render first and enhance later.

### `src/renderer/index.html`

- Maintain a CSP.
- Keep the shell minimal.
- Do not inject remote scripts.

### `src/shared/`

- Place cross-process constants, types, IPC contracts, and pure utilities here.
- Do not put Electron-specific APIs or renderer-only UI concerns in this layer.

### `tests/`

- Keep test code outside `src/`.
- Prefer mirroring the production structure as tests are added.

### `assets/`

- Store non-code static assets here unless a build step requires a more specific location.

### `forge.config.ts`

- Keep fuse hardening enabled.
- When packaging behavior changes, evaluate impact on security and startup time.
- If a future feature requires a weaker setting, document the reason directly in the config change.

## Delivery Checklist

Before finishing a task, agents must verify:

- no insecure Electron flags were introduced
- `contextIsolation`, `sandbox`, and `nodeIntegration: false` remain enforced for renderer windows
- no raw Electron or Node API was exposed to the renderer
- IPC surface is narrow, typed, and validated
- navigation and external-link behavior are restricted appropriately
- no unconditional production DevTools behavior remains
- no new synchronous main-process bottleneck was introduced
- startup work is still proportional to what the first screen needs
- large dependencies were justified
- documentation or comments were updated when the security/performance model changed

## Red Flags That Require Extra Scrutiny

If a task involves any of the items below, agents should slow down, document the tradeoff, and avoid autonomous broad changes:

- enabling Node integration
- disabling sandboxing or context isolation
- loading remote content
- adding a `<webview>`
- exposing filesystem, shell, or process control to the renderer
- adding broad IPC passthrough methods
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
