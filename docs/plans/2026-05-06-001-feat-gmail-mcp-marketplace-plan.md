---
title: "feat: Publish gmail MCP to npm and ship as marketplace plugin (Bun → Node refactor)"
type: feat
status: active
date: 2026-05-06
---

# feat: Publish gmail MCP to npm and ship as marketplace plugin (Bun → Node refactor)

## Overview

The `mcp-servers/gmail/` package landed in PR #22 as a Bun-native, clone-and-run MCP server. To make it actually adoptable — installable from the `claude-skills` marketplace and runnable on a fresh machine without a Bun install — three things need to happen together: a Bun → Node refactor so `npx` works on plain Node, an npm publish of `@jdickey1/mcp-gmail`, and a thin plugin shell at `plugins/gmail-mcp/` that the marketplace can list and that wires the published package into a user's MCP config automatically.

This plan covers the public (Track 1) work only. The same shape will be applied to `cos-cron`'s private google-contacts MCP in a follow-up plan in the private repo.

---

## Problem Frame

**Current state.** The gmail MCP is a Bun-only TypeScript package. To use it, an adopter must: clone the repo, install Bun, run `bun install`, run `bun run auth` from the source dir, then hand-edit `~/.claude.json` with an absolute path to `src/index.ts`. That's ~5 manual steps and a non-default runtime dependency. Anyone who'd otherwise install via the marketplace bounces.

**Target state.** Same MCP surface, but: published to npm, runnable via plain `npx` on a fresh machine, listed in the public `marketplace.json`, and installable as a plugin that auto-registers the MCP server in the user's config. One marketplace install + a one-time `npx mcp-gmail-auth` flow gets a working integration.

**Why both at once.** The Bun-to-Node refactor is the prerequisite for npm publish (Bun-only artifacts can't be `npx`'d on stock Node), and the plugin wrapper without a published package would force adopters back to clone-and-run. Splitting the three pieces across PRs would leave the marketplace pointing at a half-shipped MCP for whoever syncs in between.

---

## Requirements Trace

- R1. The MCP server runs on a fresh machine with only Node.js installed (no Bun required).
- R2. The package is published as `@jdickey1/mcp-gmail` on npm (public, free tier).
- R3. The published package exposes two CLI entrypoints: the MCP server itself (`mcp-gmail`) and the OAuth setup CLI (`mcp-gmail-auth`).
- R4. A plugin at `plugins/gmail-mcp/` declares the MCP server in its manifest so installing the plugin auto-wires the user's MCP config.
- R5. The plugin is listed in `.claude-plugin/marketplace.json` so it shows up in marketplace browsers.
- R6. The existing `mcp-servers/gmail/` source remains the single source of truth — no duplication into the plugin folder.
- R7. Existing 19 unit tests pass on the new test runner. Test coverage does not regress.
- R8. The README setup walkthrough is updated for the new install path (`npx` instead of clone-and-run); clone-and-develop instructions stay for contributors.

---

## Scope Boundaries

- The cos-cron substrate's `~/.claude.json` will continue to point at the local source clone (`bun run src/index.ts`). Migrating it to the published `npx` invocation is a separate concern and out of scope for this plan — the existing local entry already works and isn't broken by this work.
- The google-contacts MCP migration is out of scope. It will get its own plan in `claude-skills-private`.
- We do not promise Windows compatibility yet — the credential-store still has macOS-keychain-first semantics with a file fallback. CI on Windows is not in scope here.
- We do not migrate from `googleapis` to a hand-rolled REST client. The official client stays.
- We do not change the four-tool surface (`search_emails`, `read_email`, `get_thread`, `list_labels`).

### Deferred to Follow-Up Work

- google-contacts MCP gets the same npm + plugin treatment: separate plan in claude-skills-private.
- Migrate cos-cron's local `~/.claude.json` gmail entry from `bun run` to `npx @jdickey1/mcp-gmail`: defer until the npm package has been smoke-tested for at least a week.
- A dedicated `/gmail-mcp:setup` slash command that walks users through GCP OAuth: defer; the README walkthrough is sufficient for v0.1, and we'll add the command if friction reports come in.

---

## Context & Research

### Relevant Code and Patterns

- `mcp-servers/gmail/src/index.ts` — current Bun shebang + `Bun.spawnSync` usage in CLI, otherwise portable.
- `mcp-servers/gmail/src/credential-store.ts` — currently uses `Bun.spawnSync` to shell out to `security`. Direct port to `node:child_process` `spawnSync`.
- `mcp-servers/gmail/src/tools.test.ts` — uses `bun:test` (`describe`, `test`, `expect`). Node 20+ ships `node:test` with a near-identical API; minor rewrites only.
- `mcp-servers/gmail/cli/auth.ts` — uses `Bun.spawnSync` for `open`/`xdg-open`. Same `node:child_process` swap.
- `mcp-servers/gmail/package.json` — already has reasonable shape; needs `bin` entries, `files`, `main`/`types` pointing to `dist/`, `prepublishOnly`, `publishConfig.access: public`.
- `mcp-servers/gmail/tsconfig.json` — `noEmit: true` and `allowImportingTsExtensions: true`. Both flip for the build target.
- `plugins/digest/.claude-plugin/plugin.json` — minimal shape for plugin manifest (name/description/author). Does not include `mcpServers`; we'll be the first plugin to add that field.
- `.claude-plugin/marketplace.json` — flat `plugins[]` array, each entry has `name`, `description`, `source: ./plugins/<name>`, `category`, `homepage`.

### Institutional Learnings

- The user's preference (saved in memory `feedback-prefer-official-or-direct-mcps.md`) is "official or direct API > third-party MCP". The in-house gmail MCP is the direct-API choice; this plan completes the adoption story by making it install-able like any official package.
- Plugin manifests support `mcpServers` per Claude Code's plugin schema. None of the existing plugins in this repo use it yet, so this work is also the de-facto reference example for future MCP-bundling plugins.

### External References

- Anthropic Claude Code plugin schema documents `mcpServers` as a top-level field in `plugin.json` (mirror of `mcp.json` shape). Each entry maps a server name to `{ command, args, env? }`.
- `node:test` ships in Node 18.0+ stable, with `describe`/`test`/`it`/`before`/`after` and an assertion helper. For our test surface (no snapshots, no async beforeEach trickery), it's a 1:1 swap with `bun:test` apart from import path and assertion module.
- npm scoped packages publish public when `publishConfig.access` is `"public"` or via `npm publish --access public`. Without that, scoped packages default to private and the publish command errors for free-tier users.

---

## Key Technical Decisions

- **Compile to `dist/`, ship JS not TS.** `npx` users get a stock Node entry point (`dist/index.js`) with no runtime transpilation cost. Source stays in `src/`. This is the standard npm pattern and avoids forcing every adopter to install `tsx` or similar.
- **Test runner: `node:test`, not vitest.** Node's built-in test runner is enough for our suite (4 modules, 19 tests, no fixtures, no snapshots, no timer mocking). Adding vitest would be a third-party dep just to keep `describe/test/expect` ergonomics, which `node:test` provides natively. Keeps the dependency surface tiny.
- **Source imports keep `.js` extensions, not `.ts`.** `tsc` with `moduleResolution: NodeNext` requires explicit `.js` extensions in ESM imports. The TS compiler resolves `./foo.js` → `./foo.ts` at compile time and emits `./foo.js` in the output. This is the cleanest dual-mode setup.
- **Two `bin` entries.** `mcp-gmail` for the server, `mcp-gmail-auth` for the OAuth setup CLI. Lets users do `npx -p @jdickey1/mcp-gmail mcp-gmail-auth` for setup without confusing dual-purpose binaries.
- **Plugin shell does not vendor source.** `plugins/gmail-mcp/.claude-plugin/plugin.json` declares the MCP via `npx @jdickey1/mcp-gmail`. No code duplication; the plugin is configuration-only.
- **`Bun.spawnSync` → `child_process.spawnSync`.** Direct API parity. Both return `{ stdout, stderr, status }` (with field renames: `exitCode` → `status`). Trivial swap, no behavioral change.
- **Keep Bun support for development.** `package.json` keeps `bun.lock`; `bun test` still works (Bun reads `node:test`). Nothing forces existing Bun users off — the change is purely additive support for Node.

---

## Open Questions

### Resolved During Planning

- **Should the plugin vendor the MCP source?** No — `npx` keeps the plugin trivial. (Vendoring would force a publish-and-update dance every time the MCP changes.)
- **Should we publish under `@jdickey1/` scope or unscoped?** Scoped — keeps `mcp-gmail` available as an unscoped name in case anyone else publishes a competing one, and makes ownership unambiguous.
- **Test runner choice — node:test, vitest, or jest?** `node:test`. Built-in, zero deps, our test shape doesn't need anything heavier.

### Deferred to Implementation

- **Exact CommonJS-vs-ESM publish format.** Default to ESM (`"type": "module"`) to match current source. Verify on first publish that `npx` invocation works under both Node 20 and 22; if there's friction, consider a dual-publish via `tsup`. Don't pre-build for this until smoke test surfaces a problem.
- **Whether `prepublishOnly` should run `npm test` or just `tsc`.** Probably both, but exact script wiring depends on whether `node:test` runs cleanly in CI-style invocation. Resolve when writing `package.json` scripts.
- **Whether to add a `postinstall` notice pointing users at the auth command.** Useful but easy to over-do; resolve based on what the install output looks like in practice.

---

## Implementation Units

- U1. **Refactor credential-store + cli/auth from `Bun.spawnSync` to `child_process.spawnSync`**

**Goal:** Remove the only two Bun runtime dependencies in the source so the package can run on plain Node.

**Requirements:** R1

**Dependencies:** None

**Files:**
- Modify: `mcp-servers/gmail/src/credential-store.ts`
- Modify: `mcp-servers/gmail/cli/auth.ts`
- Test: `mcp-servers/gmail/src/tools.test.ts` (no new tests — credential-store has no existing tests; behavior is preserved)

**Approach:**
- Replace `Bun.spawnSync({ cmd, stderr: "pipe" })` with `spawnSync(cmd[0], cmd.slice(1), { encoding: "utf-8" })` from `node:child_process`.
- Field rename: `result.exitCode` → `result.status`. `result.stdout` becomes a string directly when `encoding: "utf-8"` is set, so the `TextDecoder` wrapping goes away.
- Keep the function signatures and return shapes identical.

**Patterns to follow:**
- The existing `defaultSpawn` injection pattern in `credential-store.ts` — it makes the swap localized to one function, with the rest of the file unaware of the runtime.

**Test scenarios:**
- Test expectation: none — pure runtime adapter swap with no behavior change. Existing 19 tests (which mock the spawn function) prove the surface is unchanged.

**Verification:**
- `node` (not `bun`) can `import("./credential-store.js")` from a built `dist/` and successfully read/write a keychain entry.

---

- U2. **Switch test runner from `bun:test` to `node:test`**

**Goal:** Make the test suite runnable on plain Node 20+ so CI and adopters don't need Bun.

**Requirements:** R7

**Dependencies:** U1 (the spawn refactor lands first so credential-store tests, if added later, target the same runtime)

**Files:**
- Modify: `mcp-servers/gmail/src/tools.test.ts`
- Modify: `mcp-servers/gmail/package.json` (test script)

**Approach:**
- Change import from `bun:test` to `node:test`. `describe`, `test`, and the timing imports translate 1:1.
- Replace `expect(x).toBe(y)` / `expect(x).toEqual(y)` / `expect(x).toHaveLength(n)` with `node:assert/strict` equivalents (`assert.equal`, `assert.deepStrictEqual`, `assert.equal(arr.length, n)`). The test suite has ~42 assertions; this is mechanical.
- Keep file naming `*.test.ts` so `node --test` discovers them. Add a tsx loader (or use ts-node, or compile-then-run) so `.ts` files run under `node:test`.
- Decision point: simplest is `tsx --test src/**/*.test.ts` via the `tsx` devDependency. Adds one dep but stays out of the publish surface (`devDependencies`).

**Patterns to follow:**
- node:test docs default examples (TAP output, `--test-reporter=spec` for human reading).

**Test scenarios:**
- Happy path: All 19 existing tests run and pass under `node --test` (with tsx loader for `.ts`).
- Edge case: A deliberately-failing assertion produces a clear diff/message — verify by temporarily breaking one test and confirming the output is readable.

**Verification:**
- `npm test` from the package root runs all 19 tests on plain Node, exits 0.
- `bun test` (existing path) still works for users who prefer Bun.

---

- U3. **Add tsc build pipeline producing `dist/`**

**Goal:** Compile TypeScript source to JavaScript so `npx` users get a runnable artifact without a TypeScript runtime.

**Requirements:** R1, R3

**Dependencies:** U1, U2

**Files:**
- Modify: `mcp-servers/gmail/tsconfig.json` (split into base + build configs, or flip flags conditionally)
- Modify: `mcp-servers/gmail/package.json` (add `build` script, `main`, `types`, `exports`)
- Create: `mcp-servers/gmail/tsconfig.build.json` (production build target)
- Modify: `mcp-servers/gmail/.gitignore` (already excludes `dist/` — verify)

**Approach:**
- Source imports change from `./foo.ts` to `./foo.js` (TS resolves to `.ts`, emits `.js`). This is the right ESM idiom for tsc + Node.
- `tsconfig.build.json` extends the base, sets `noEmit: false`, `outDir: "dist"`, `declaration: true`, `declarationMap: true`, `sourceMap: true`. Removes `allowImportingTsExtensions`.
- Base `tsconfig.json` keeps dev-friendly settings (no emit) so `tsc --noEmit` is the typecheck path.
- `package.json` `main: "dist/index.js"`, `types: "dist/index.d.ts"`, optional `exports` map for finer control.
- Add shebangs `#!/usr/bin/env node` to `src/index.ts` and `cli/auth.ts` (replacing the current `#!/usr/bin/env bun`). Make them chmod +x in the build step (tsc doesn't preserve modes — handle in a tiny postbuild step or via npm `prepublishOnly`).

**Patterns to follow:**
- Standard TS-to-NPM-package layout: `src/` source, `dist/` artifact, dual tsconfig.

**Test scenarios:**
- Happy path: `npm run build` produces `dist/index.js` and `dist/cli/auth.js` with shebangs intact.
- Happy path: `node dist/index.js` boots the MCP server and responds to a stdio `tools/list` request (manual smoke).
- Edge case: imports across modules resolve correctly in compiled output (no `Cannot find module './foo.ts'` errors at runtime).

**Verification:**
- `dist/` builds cleanly, contains JS + .d.ts files.
- `node dist/index.js` boots and lists 4 tools over stdio (smoke).
- `node dist/cli/auth.js --help` (or any startup path) doesn't throw.

---

- U4. **Configure package.json for npm publish**

**Goal:** Make the package npm-publish-ready with correct metadata, bin entries, and publish guards.

**Requirements:** R2, R3

**Dependencies:** U3

**Files:**
- Modify: `mcp-servers/gmail/package.json`
- Create: `mcp-servers/gmail/.npmignore` (or use `files` field exclusively — prefer `files`)

**Approach:**
- Add `bin: { "mcp-gmail": "./dist/index.js", "mcp-gmail-auth": "./dist/cli/auth.js" }`.
- Add `files: ["dist/", "README.md", "LICENSE"]` to limit the publish tarball to runtime artifacts + docs.
- Add `publishConfig: { "access": "public" }` so `npm publish` doesn't error on the scoped name.
- Add `engines: { "node": ">=20" }` (matches our Node 20 target for `node:test` and tsx).
- Add `prepublishOnly: "npm run typecheck && npm test && npm run build"` so a botched publish is impossible.
- Update repository field's `directory` to `mcp-servers/gmail` (already correct) so npm's "view repo" links to the subfolder.
- Drop `private` if it exists; double-check.
- Verify `LICENSE` is bundled — copy from repo root if needed (npm only reads from package dir).

**Patterns to follow:**
- Common npm-publish hygiene used by `@modelcontextprotocol/sdk`, `googleapis`, etc.: explicit `files`, scoped bin entries, public access, prepublish guard.

**Test scenarios:**
- Happy path: `npm pack` produces a tarball containing `dist/`, `README.md`, `LICENSE`, `package.json` — and nothing else.
- Edge case: `npm publish --dry-run` succeeds and previews the right file set without actually publishing.
- Error path: deliberately break a test, run `npm publish --dry-run`, and verify `prepublishOnly` blocks the publish.

**Verification:**
- `npm pack` output is < 100 KB (sanity check that we're not accidentally shipping `node_modules` or sources).
- Tarball file list matches expectation.

---

- U5. **Publish `@jdickey1/mcp-gmail` v0.1.0 to npm (manual step + verification)**

**Goal:** Get the package live on the npm registry so the plugin can reference it.

**Requirements:** R2

**Dependencies:** U4

**Files:**
- None modified — this is a manual publish gate. The implementer (or the user) runs `npm publish` from a terminal.

**Approach:**
- User runs `npm login` (one-time, if not already logged in to npm).
- User runs `npm publish` from `mcp-servers/gmail/`.
- Verify: `npm view @jdickey1/mcp-gmail` returns metadata. `npx -y @jdickey1/mcp-gmail@0.1.0` boots the server.

**Execution note:** This is a manual gate — surface the exact commands and required user state (npm login, `@jdickey1` scope ownership) and pause for the user to run them. Do not auto-run `npm publish` from a coding agent.

**Test scenarios:**
- Happy path: `npx -y @jdickey1/mcp-gmail` (on a fresh shell, no local clone) boots the server and responds to `tools/list`. Same on a different machine if available.

**Verification:**
- Package appears on npmjs.com under the user's account, public access.
- `npx -y @jdickey1/mcp-gmail` works from any directory.

---

- U6. **Create `plugins/gmail-mcp/` plugin shell**

**Goal:** Wrap the published MCP as a Claude Code plugin so installing it auto-registers the MCP server.

**Requirements:** R4, R6

**Dependencies:** U5

**Files:**
- Create: `plugins/gmail-mcp/.claude-plugin/plugin.json`
- Create: `plugins/gmail-mcp/README.md`

**Approach:**
- `plugin.json` shape (matching the existing minimal plugin manifests in the repo, plus the `mcpServers` field):
  - `name: "gmail-mcp"`
  - `description: "Read-only Gmail MCP server. Search and read messages over the official Gmail API. Four tools: search_emails, read_email, get_thread, list_labels."`
  - `author: { name: "James Dickey", url: "https://github.com/jdickey1" }`
  - `mcpServers: { gmail: { command: "npx", args: ["-y", "@jdickey1/mcp-gmail"] } }`
- `README.md`: short — link to `mcp-servers/gmail/README.md` for the full setup walkthrough; explain the one-time `npx -p @jdickey1/mcp-gmail mcp-gmail-auth` step; show what tools become available after install.
- No vendored source. The plugin is configuration-only.

**Patterns to follow:**
- `plugins/digest/.claude-plugin/plugin.json` for the minimal manifest shape (name/description/author).
- The `mcpServers` field is new ground — schema reference is the Claude Code plugin docs; entries match `~/.claude.json` mcpServers shape.

**Test scenarios:**
- Happy path: After installing the plugin (manually copying or via marketplace install), the user's MCP config gets the gmail server registered, and `tools/list` shows the 4 gmail tools.
- Edge case: A user who has the same `gmail` key already in their MCP config — does the plugin's entry conflict? Verify and document conflict behavior.
- Error path: A user without an OAuth refresh token gets a clear error pointing them at `mcp-gmail-auth` (already implemented in `src/auth.ts`).

**Verification:**
- `plugin.json` validates against the plugin schema (manual check or via `claude-code` CLI if available).
- Manual install + first-use flow works on a clean Claude Code instance.

---

- U7. **Add gmail-mcp entry to `.claude-plugin/marketplace.json`**

**Goal:** List the plugin in the public marketplace so it's discoverable.

**Requirements:** R5

**Dependencies:** U6

**Files:**
- Modify: `.claude-plugin/marketplace.json`

**Approach:**
- Insert a new object into the `plugins[]` array with shape matching the existing entries:
  - `name: "gmail-mcp"`
  - `description: "..."` (mirror or shorten the plugin manifest description)
  - `source: "./plugins/gmail-mcp"`
  - `category: "productivity"` (or `"integrations"` if a more specific category is supported — verify schema)
  - `homepage: "https://github.com/jdickey1/claude-skills"`
- Sort order: append to the end, or place near other integration-flavored plugins (e.g., near `web-reader`, `digest`).

**Patterns to follow:**
- All existing entries in `marketplace.json` — same field set, same conventions.

**Test scenarios:**
- Happy path: `.claude-plugin/marketplace.json` is valid JSON after the edit.
- Happy path: A marketplace browser (manual or via Claude Code's plugin marketplace UI) shows the new plugin and can install it.

**Verification:**
- `jq -e '.plugins | map(select(.name == "gmail-mcp")) | length == 1' .claude-plugin/marketplace.json` returns truthy.
- Marketplace install from a fresh Claude Code instance succeeds end-to-end.

---

- U8. **Update `mcp-servers/gmail/README.md` for the new install path**

**Goal:** Reflect the npm + plugin install paths as the default. Keep clone-and-develop instructions for contributors.

**Requirements:** R8

**Dependencies:** U5

**Files:**
- Modify: `mcp-servers/gmail/README.md`

**Approach:**
- Add a "Install" section at the top with two paths:
  1. **Recommended: marketplace** — install the `gmail-mcp` plugin from the claude-skills marketplace; the MCP wires itself up.
  2. **Manual MCP config** — add `{ command: "npx", args: ["-y", "@jdickey1/mcp-gmail"] }` to your MCP client config.
- Keep existing setup walkthrough (GCP OAuth client, `mcp-gmail-auth` flow); update the auth invocation to `npx -p @jdickey1/mcp-gmail mcp-gmail-auth`.
- Move clone-and-develop instructions into a "Development" or "Contributing" section near the bottom — secondary path now.

**Patterns to follow:**
- Existing README structure; preserve the tools table, credential-store table, and design-notes section.

**Test scenarios:**
- Test expectation: none — pure docs update, no behavior change.

**Verification:**
- A skim by someone who hasn't seen the project before should make the install path obvious in under 30 seconds.

---

## System-Wide Impact

- **Interaction graph:** `~/.claude.json` MCP server entries; the cos-cron substrate's local pin to `bun run` continues to work in parallel — these don't conflict because the plugin install adds a new entry rather than mutating existing ones (verify in U6).
- **Error propagation:** The `npx`-based invocation introduces a new failure mode: npm/network is down → MCP fails to start. Existing local-source invocation has no such dependency. Document the tradeoff in the plugin README.
- **State lifecycle risks:** None — credentials remain in keychain/file store, unchanged.
- **API surface parity:** The four MCP tools' input/output shapes do not change. Tests prove this.
- **Integration coverage:** The `tools/list` smoke test on a published-and-`npx`'d artifact is the new integration coverage. Add it to U5 verification.
- **Unchanged invariants:** OAuth scope stays `gmail.readonly`. Tool names, parameter shapes, and response shapes stay identical. The plugin shell does not duplicate or fork the source.

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| `@jdickey1` npm scope not yet owned by the user. | U5 includes "verify scope ownership" as a manual prerequisite. If unowned, fall back to unscoped `mcp-gmail` (with the small naming-collision risk that brings). |
| ESM-only publish breaks under unusual Node configurations (e.g., a downstream consumer in CommonJS). | Document `"type": "module"` and Node 20+ requirement in `engines`. If a CJS consumer surfaces, dual-publish via `tsup` is a one-day follow-up. |
| `node:test` assertion API differs subtly from `bun:test` `expect()` (e.g., subset matching, snapshot behavior). | Our suite uses only `toBe`/`toEqual`/`toHaveLength` — all 1:1 with `assert.strict`. No snapshots, no advanced matchers. Mechanical port. |
| Plugin manifest schema for `mcpServers` changes between Claude Code versions. | Pin to the current stable plugin schema version in `plugin.json` if the schema supports it; otherwise document the supported Claude Code version range in the plugin README. |
| `npx` cold-start latency adds ~500ms per server boot vs. local `bun run`. | Acceptable for adoption — interactive MCP boots happen once per session. Document and move on. If adopters complain, recommend `npm i -g @jdickey1/mcp-gmail` and direct `command: "mcp-gmail"`. |
| The `mcpServers` field in `plugin.json` may not be honored by the marketplace UI on all Claude Code versions. | Verify on a current Claude Code build before merging U7. If unsupported, fall back to documenting the manual MCP-config snippet in the plugin README and treat the marketplace listing as discovery-only for now. |

---

## Documentation / Operational Notes

- README rewrite (U8) is the primary doc touchpoint.
- Add a one-line entry to the repo root `README.md` under a "Plugins" or "MCP servers" section pointing at `plugins/gmail-mcp/`.
- npm publish is operational, not a code change — surface in the PR description that the user (not the agent) will run `npm publish`.
- After publish, the repo's GitHub releases page should get a v0.1.0 release tag pointing at the package commit, mirroring npm. Optional but recommended for adopters who want changelogs.

---

## Sources & References

- This session's earlier work: PR #22 on jdickey1/claude-skills (the gmail MCP itself).
- Claude Code plugin manifest reference (mcpServers field).
- npm scoped-package docs for `publishConfig.access`.
- Node.js `node:test` runner docs (Node 20+).
