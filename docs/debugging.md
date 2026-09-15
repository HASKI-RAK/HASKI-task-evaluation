# Deep debugging NodeGrade

The debug stack provides a deterministic full application, browser automation, backend
breakpoints, and a development-only LiteGraph inspection API.

## Start the stack

Install dependencies and Playwright browsers once:

```bash
yarn install
yarn playwright install chromium firefox
```

Start every service and wait for readiness:

```bash
yarn debug:up
```

Open these endpoints:

- Editor: <http://localhost:15173/ws/editor/debug/demo/1>
- Student view: <http://localhost:15173/ws/student/debug/demo/1>
- Backend health: <http://localhost:15000/health>
- Deterministic model health: <http://localhost:18000/health>
- Node inspector: `localhost:19229`
- PostgreSQL: `localhost:15432`

The stack uses a dedicated Compose project and port range, allowing it to run alongside
the regular development server. Port overrides use these environment variables:

- `NODEGRADE_DEBUG_FRONTEND_PORT`
- `NODEGRADE_DEBUG_BACKEND_PORT`
- `NODEGRADE_DEBUG_MODEL_PORT`
- `NODEGRADE_DEBUG_DATABASE_PORT`
- `NODEGRADE_DEBUG_INSPECTOR_PORT`

## Operate the stack

```bash
yarn debug:status
yarn debug:logs
yarn debug:down
yarn debug:reset
```

`debug:reset` recreates the database volume, reapplies Prisma migrations, and seeds the
stable editor and student workflows.

## Browser control

Run the deterministic browser suite in Chromium and Firefox:

```bash
yarn test:e2e
```

Interactive modes:

```bash
yarn test:e2e:headed
yarn test:e2e:debug
```

Failures retain a screenshot, video, and Playwright trace under `test-results/`. Open a
trace with:

```bash
yarn playwright show-trace test-results/<test-name>/trace.zip
```

## Attach a backend debugger

Attach a Node debugger to `localhost:19229`. The Nest process runs in watch mode with
source maps and accepts breakpoints in `packages/backend/src`.

## Inspect LiteGraph

The debug Compose service sets `VITE_DEBUG_BRIDGE=true`. In the browser console,
`window.__NODEGRADE_DEBUG__` provides:

- `graphSnapshot()`, `listNodes()`, and `getNode(id)`
- `selectNode(id)` and `addNode(type, position)`
- `connectNodes(sourceId, sourceSlot, targetId, targetSlot)`
- `setNodeProperty(id, property, value)`
- `socketState()`, `recentEvents()`, and `clearEvents()`
- `waitForEvent(name)`, `runGraph(answer)`, and `saveGraph(name)`

Snapshots and captured event payloads redact credential-shaped property names. The bridge
is compiled into development builds when `VITE_DEBUG_BRIDGE=true`. Regular development
sessions leave the flag unset.

## Service worker behavior

Debug sessions set `VITE_ENABLE_SW=false`, giving each reload the current Vite bundle.
Set `VITE_ENABLE_SW=true` when the debugging target is PWA installation, offline behavior,
or update handling.
