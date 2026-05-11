---
title: "feat: google-contacts MCP — Bun→Node refactor, npm publish, marketplace plugin"
type: feat
status: completed
date: 2026-05-06
deepened: 2026-05-06
completed: 2026-05-11
---

# feat: google-contacts MCP — Bun→Node refactor, npm publish, marketplace plugin

**Target repos:** `claude-skills-private` (MCP server source) and `claude-skills` (public marketplace plugin shell). The MCP server stays in the private repo; the npm artifact is public; the plugin discovery surface goes in the public marketplace. Repo-relative paths in this plan are rooted at whichever repo the unit's files live in — each unit names the repo explicitly when ambiguous.

---

## Overview

Track 2 of the in-house MCP adoption work, mirroring Track 1 (`gmail-MCP`, shipped 2026-05-06 as PR #23). Take the existing `mcp-servers/google-contacts/` Bun-only server in `claude-skills-private`, strip Bun from anything that ships to npm, publish as `@jdickey1/mcp-google-contacts` (public scope, free), and register a marketplace plugin shell `google-contacts-mcp` in the public `claude-skills` marketplace that wires the MCP via `npx`.

This package has a **write surface** (`apply_label`, `remove_label`, `update_contact`) backed by the full `contacts` OAuth scope — its README, plugin description, and marketplace listing must surface both the tool surface and the scope grant explicitly so adopters know what they're authorizing. That's the only meaningful divergence from Track 1. Throughout this plan, "write surface" is the canonical term; alternatives like "scoped writes" or "write tools" are avoided to keep the language consistent across the README, plugin.json, marketplace.json, and verification grep checks.

---

## Problem Frame

The same problem Track 1 solved, applied to contacts:

- The popular community Google Contacts MCPs on the registry are abandoned, vendor their own auth, or expose a sprawling write surface with no scope discipline. Track 1 documented this; the same pattern holds.
- The in-house `google-contacts` MCP currently runs only under Bun. Adopters who don't have Bun installed can't use it without a runtime install.
- The package is `private: true` and named `@cos-cron/*` — the cos-cron substrate reference is internal trivia that leaks into a public-adoption story.

After this plan: anyone with Node ≥ 20 can `npx -y @jdickey1/mcp-google-contacts` and get a small, auditable, scoped-write Google Contacts MCP. The source stays in the private repo (`claude-skills-private`); the published JS is public.

---

## Requirements Trace

- R1. The published npm artifact runs under Node without Bun installed (no `Bun.*` calls, no `bun:test` imports, no `bun run` references in shipped JS, no `@types/bun` in runtime deps).
- R2. The npm package is `@jdickey1/mcp-google-contacts`, scoped public, free tier, with stable `bin` entries (`mcp-google-contacts`, `mcp-google-contacts-auth`).
- R3. Local dev in `claude-skills-private` may continue to use Bun if convenient — the constraint is "nothing Bun-flavored leaks into the published artifact." `bun.lock`, `@types/bun` in devDeps, and `bun run` scripts in `package.json` are all permitted because they don't ship.
- R4. The marketplace plugin `google-contacts-mcp` lives in **the public `claude-skills` repo**, declares the MCP via `mcpServers: { "google-contacts": { command: "npx", args: ["-y", "@jdickey1/mcp-google-contacts"] } }`, and is registered in `.claude-plugin/marketplace.json`.
- R5. The README, plugin description, and marketplace listing name **all three** OAuth scopes explicitly: `contacts.readonly` (primary read), `contacts.other.readonly` (other-contacts read — verified in `cli/auth.ts:17-21`), and `contacts` (write). The write surface (mutates user data, idempotent, tool-limited to label CRUD + selective field updates, but the **scope grant is full `contacts` write**) is surfaced before the install instructions, not buried. The marketplace.json listing description must include the literal scope string `contacts (full write)` so an installer reading the marketplace index understands the grant before clicking install.
- R6. The published artifact does **not** include the internal one-off backfill script (`scripts/backfill-contacts-2026-05-05.ts`) — it's local-use-only and references private context.
- R7. All 6 tools are preserved with identical behavior: `search_contacts`, `get_contact`, `list_label_groups`, `apply_label`, `remove_label`, `update_contact`. (The README currently lists 5 — it's stale; `update_contact` exists in `src/index.ts`. README rewrite must reflect reality.)
- R8. Existing test coverage migrates fully — both `src/tools.test.ts` (487 LOC, **21 `test(...)` cases**) and `cli/auth.test.ts` (88 LOC, **7 `test(...)` cases** — note: this file is mislabeled; it actually exercises `Keychain` from `../src/keychain`, not the auth CLI). **Total: 28 tests must remain green post-migration.**
- R9. Track 1 (`@jdickey1/mcp-gmail`) leftover `bun run auth` error strings in `claude-skills/mcp-servers/gmail/src/auth.ts` are fixed and a republish (`0.1.2`) is shipped. These strings ship in `dist/` and reach end users; leaving them tells adopters to run a Bun command they may not have installed.

---

## Scope Boundaries

- The cos-cron substrate's local consumption of this MCP (currently `bun run` via `~/.claude.json` on the Mac Mini) **is not migrated in this plan**. Defer 1 week per the Track 1 precedent — let the npm artifact bake before flipping production cron. Plan-local follow-up only.
- No new tools or feature work. Behavior is preserved exactly. If a tool's response shape changes, that's a bug in the migration, not a feature of it.
- No write-scope reduction. The current surface (label apply/remove + selective `update_contact` field writes) stays as-is. A future plan may revisit the write surface; this one is a runtime + packaging migration.
- The `claude-skills-private` marketplace stays as-is. The plugin shell goes in `claude-skills` (public), not `claude-skills-private`. We don't double-list it.

### Deferred to Follow-Up Work

- **cos-cron MCP config flip** (`~/.claude.json` on Mac Mini): swap `bun run /path/to/index.ts` to `npx -y @jdickey1/mcp-google-contacts`. Defer ~1 week after npm publish to verify registry stability and behavior parity. Tracked separately.

---

## Context & Research

### Relevant Code and Patterns

**Track 1 reference** (closest possible prior art — just shipped 2026-05-06):

- `claude-skills` repo, commit `4a37f44` (`feat(gmail-mcp): npm-publishable Node build + marketplace plugin`)
- `claude-skills/mcp-servers/gmail/package.json` — exact shape to mirror for name, bins, files allowlist, scripts, prepublishOnly chain, devDeps
- `claude-skills/mcp-servers/gmail/tsconfig.json` + `tsconfig.build.json` — dual config pattern (typecheck noEmit / build emits to `dist/`)
- `claude-skills/mcp-servers/gmail/src/credential-store.ts` — the `node:child_process.spawnSync` replacement pattern for `Bun.spawnSync` (3 call sites converted there; google-contacts has 2)
- `claude-skills/mcp-servers/gmail/src/tools.test.ts` — `node:test` + `node:assert/strict` migration pattern from `bun:test` (mechanical: `expect(x).toBe(y)` → `assert.equal(x, y)`, etc.)
- `claude-skills/plugins/gmail-mcp/.claude-plugin/plugin.json` — first plugin in the repo to use the `mcpServers` field; google-contacts-mcp will be the second
- `claude-skills/.claude-plugin/marketplace.json` (entry 19, `gmail-mcp`) — exact registration shape
- `claude-skills/docs/plans/2026-05-06-001-feat-gmail-mcp-marketplace-plan.md` — Track 1's plan, including the 8-unit decomposition this plan loosely mirrors

**Current google-contacts surface** (`claude-skills-private/mcp-servers/google-contacts/`):

- `src/keychain.ts:7` — single `Bun.spawnSync({ cmd: ["security", ...args], stderr: "pipe" })` call inside `defaultSpawn`. Public type `SpawnLike` returns `{ stdout: string; exitCode: number }` (line 4); consumers and tests assert this shape — the Node migration must preserve the field name `exitCode`, not switch to `status`.
- `src/keychain.ts:73` — **`KEYCHAIN_ACCOUNT = "james@jdkey.com"`** hardcoded. This compiles to `dist/` and ships to npm; it is the author's personal Google account leaking into the public artifact. Must be fixed before publish (see U1).
- `src/keychain.ts:75-88` — the **actual** keychain service prefix is `cos-cron.google-contacts.*` (three constants: `cos-cron.google-contacts`, `cos-cron.google-contacts.client_id`, `cos-cron.google-contacts.client_secret`). These strings are asserted verbatim in `cli/auth.test.ts:74-87`; renaming them invalidates every existing user's stored tokens. Plan keeps them as-is.
- `src/index.ts:1` — `#!/usr/bin/env bun` shebang
- `src/index.ts:2-15` — line 1 shebang, lines 2-5 sdk/google/zod imports, lines 6-15 local imports from `./auth.ts` and `./tools.ts` with explicit `.ts` extensions (Bundler resolution); flip to `.js` for NodeNext
- `src/auth.ts` — **three** error strings reference Bun-era invocations: line 31 (`Run cli/auth.ts with...`), line 39 (`Run cli/auth.ts with...`), line 49 (`Run \`bun run auth\` to authorize.`). All three ship in `dist/` and reach end users; all three must change to the published `npx -p @jdickey1/mcp-google-contacts mcp-google-contacts-auth` invocation.
- `src/tools.ts` — type-only import `import type { people_v1 } from "googleapis"`. **No internal cross-module imports**; U1 only needs to verify, not edit.
- `src/tools.test.ts:1` — `bun:test` import (487 LOC, **21 tests**)
- `cli/auth.ts:1` — `#!/usr/bin/env bun` shebang
- `cli/auth.ts:17-21` — three OAuth scopes declared: `contacts.readonly`, `contacts.other.readonly`, `contacts`. R5 must reflect all three.
- `cli/auth.ts:54-61` — credentials read **only from env vars** (`GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`); no `process.argv` parsing. Verified clean.
- `cli/auth.ts:74` — error string referencing `bun run auth`
- `cli/auth.ts:83` — `Bun.spawnSync({ cmd: ["open", url], stderr: "pipe" })` for opening the OAuth URL
- `cli/auth.test.ts` — **mislabeled file**: it imports `Keychain` from `../src/keychain.ts` and exercises the keychain contract + identifier constants. 88 LOC, **7 tests**, also imports `SpawnLike` as a type. This is a Keychain test, not a CLI exit-code test; treat U2's migration as purely mechanical assertion-rewrites with no subprocess shape concerns.
- `tsconfig.json` — `moduleResolution: "Bundler"`, `types: ["bun"]`, `allowImportingTsExtensions: true` — all need to flip
- `package.json` — `private: true`, `@cos-cron/*` name, `bun run` scripts, no build, no files allowlist. **Already has `"type": "module"` (line 5)** — keep this in the rewrite.
- `scripts/backfill-contacts-2026-05-05.ts` — internal one-off, must NOT ship

### Institutional Learnings

- `feedback-prefer-official-or-direct-mcps.md` — drives the "build adoption-grade standards" framing.
- `feedback-no-secrets-in-docs.md` — the OAuth Desktop client setup walkthrough goes in the README, but the actual client ID/secret never lands in any committed file. The auth CLI accepts them as env vars and stores in keychain.
- Track 1 incident: npm tombstones unpublished versions for 24h. If a `0.1.0` publish is attempted and rejected (or the user's already published `0.1.0` to reserve the name), bump to `0.1.1` immediately. Don't fight the tombstone.
- Track 1 incident: `npm install` in a Bun-tracked dir deletes `bun.lock`. If keeping Bun for local dev, restore via `git checkout bun.lock` after any `npm install`.

### External References

None needed. This is a near-mirror of Track 1; all the API/runtime patterns are already validated locally.

---

## Key Technical Decisions

- **Source repo: `claude-skills-private`. npm artifact: public. Plugin shell: `claude-skills` (public).** The user explicitly chose this posture. npm scoped public packages are free, the source repo stays private (so internal git history, scripts, and notes don't leak), and adopters discover via the public marketplace.
- **Rename `@cos-cron/mcp-google-contacts` → `@jdickey1/mcp-google-contacts`.** The `@cos-cron` scope is private internal naming; consumers shouldn't see it. Match the `@jdickey1/mcp-gmail` precedent.
- **Keychain service prefix: keep `cos-cron.google-contacts.*` (the actual current prefix). Do NOT rename to match the new package name.** Existing user tokens are stored under these three keys — `cos-cron.google-contacts`, `cos-cron.google-contacts.client_id`, `cos-cron.google-contacts.client_secret` — and `cli/auth.test.ts:74-87` asserts them verbatim. Renaming silently invalidates every adopter's stored credentials. The trade-off is a published artifact containing the literal string `cos-cron`, which is acceptable: the string is internal substrate trivia, not PII or a vulnerability vector. A README footnote in U5's "Credential storage" section explains the historical name.
- **Replace hardcoded `KEYCHAIN_ACCOUNT = "james@jdkey.com"` with env-overridable resolution.** Mirror Track 1's pattern: `process.env.MCP_GOOGLE_CONTACTS_ACCOUNT ?? process.env.USER ?? "default"`. The hardcoded personal email currently ships into `dist/` and is the single most embarrassing PII leak in the artifact. The `cli/auth.test.ts` constants assertion (`account: "james@jdkey.com"`) must be updated in U2 to assert against the resolved default in the test environment (likely `process.env.USER`); use a fixture that pins the resolved value.
- **Strip Bun from the *shipped* artifact only; permit Bun in local dev.** Per user clarification: "for the mcps … for anything we're doing on npm" no Bun. `bun.lock`, `@types/bun` in devDeps, and a `bun run` script entry are fine because none of them land in `dist/` or are required to consume the package. The `files` allowlist enforces this — only `dist/`, `README.md`, `LICENSE` ship.
- **Dual tsconfig: base = typecheck (`noEmit`), `tsconfig.build.json` = compile to `dist/`.** Required by mechanics, not just mirror: the base tsconfig sets `noEmit: true` to support `tsc --noEmit` typechecking; you cannot also emit from the same config. The build config extends the base and overrides `noEmit: false` plus `outDir`. NodeNext resolution means source imports use `.js` extensions even though they resolve to `.ts` files at typecheck time and emit `.js` at build time.
- **Test runner: `tsx --test`.** Same as Track 1. Native `node:test` + `node:assert/strict`, no Jest, no Vitest, no extra runtime deps. Pass explicit file paths in the npm script (not globs) — Node 20's `--test` does not support glob expansion natively.
- **`prepublishOnly` chain: clean → typecheck → test → build.** Same as Track 1. Anything that fails typecheck or tests prevents publish.
- **Backfill script handling: NOT in `files` allowlist; stays in source repo.** `scripts/backfill-contacts-2026-05-05.ts` is internal-only and references private context. Don't move it; just exclude it from the npm artifact via the allowlist. U4 verification adds an explicit positive grep (`npm pack --dry-run 2>&1 | grep -c "scripts/"` returns 0) to lock this in.
- **Supply chain posture for npm publish: 2FA enforced on the `@jdickey1` npm account; publish with `--provenance` when the environment supports it; use a granular publish token scoped to the `@jdickey1` package scope (not the account root token).** `npx -y @jdickey1/mcp-google-contacts` fetches whatever is current on the registry with no integrity check beyond npm's tarball hash; a compromised account ships malicious code with full Google Contacts write access to every adopter on next invocation. U6's pre-publish checklist enforces these. Track 1 set this precedent loosely; Track 2 makes it explicit.
- **Version bumping: start at `0.1.0`. If npm rejects (tombstoned), bump to `0.1.1` and re-publish.** Track 1 hit this; document the workaround so the implementer doesn't repeat the diagnosis.
- **Write-tool surface stays. Documented prominently, not narrowed.** `apply_label`, `remove_label`, `update_contact` continue to work as-is. README, plugin description, and marketplace.json description name **all three** scopes (`contacts.readonly`, `contacts.other.readonly`, `contacts` write) before any install instructions, and call out that the `contacts` grant is the full write scope (the tools just choose to restrain themselves to label CRUD + selective field updates).

---

## Open Questions

### Resolved During Planning

- Q: Should the npm package be public or private (paid scope)? **A: Public.** User chose option 1 in the planning question.
- Q: Where does the marketplace plugin shell live — `claude-skills` (public) or `claude-skills-private`? **A: `claude-skills` (public).** Same answer.
- Q: Do we narrow the write surface during this migration? **A: No.** Migration only. Future plan may revisit.
- Q: Do we ship the internal backfill script? **A: No.** `files` allowlist excludes `scripts/`.
- Q: Port Track 1's `EnvOverrideStore` parity layer (`MCP_GOOGLE_CONTACTS_*` env vars override stored credentials, useful for CI/Docker)? **A: No, defer.** Track 1 has it; Track 2 doesn't need it for v1. The `KEYCHAIN_ACCOUNT` fix is the minimum required for adopter usability; full env-override parity is an additive feature, not a migration blocker. U5 README documents the absence so adopters know the limitation. Revisit in a future minor version if anyone needs it.
- Q: Rename keychain prefix `cos-cron.google-contacts.*` → `mcp-google-contacts.*` to match the new package name? **A: No.** Existing tokens are under the old prefix; renaming requires every user to re-auth. The internal-substrate name in the published artifact is acceptable cosmetic noise.

### Deferred to Implementation

- **Exact `0.1.x` version at publish time.** Start at `0.1.0`; if tombstoned, `0.1.1`. Resolved at the npm publish step.
- **Whether `cli/auth.test.ts` needs structural changes beyond the `bun:test` → `node:test` mechanical swap.** The file exercises the auth CLI's exit codes and error messages; some assertions may need light reshaping if the spawn/exit interface differs subtly between runtimes. Resolve when the test file is opened.
- **Whether the `update_contact` tool description needs sharpening for the public README.** It currently exists in `src/index.ts` but isn't in the (stale) 5-tool README table. The new README must list all 6; copy-tone calibration is a write-time call.

---

## Output Structure

After this plan ships, the layouts are:

```
claude-skills-private/                            # private repo, source of truth
  mcp-servers/
    google-contacts/
      src/
        index.ts                # shebang: node, imports use .js
        auth.ts                 # all 3 error strings (lines 31, 39, 49) reference the published npx auth bin
        tools.ts                # unchanged (verify only — no internal cross-module imports)
        keychain.ts             # node:child_process.spawnSync replaces Bun.spawnSync; SpawnLike.exitCode shape preserved; KEYCHAIN_ACCOUNT becomes env-overridable; service prefix stays cos-cron.google-contacts.*
        tools.test.ts           # node:test + node:assert/strict (21 tests)
      cli/
        auth.ts                 # shebang: node; platform-aware openBrowser (darwin/win32/else→xdg-open); error string + bin name updated
        auth.test.ts            # node:test + node:assert/strict (7 tests; mislabeled — actually a Keychain test; account assertion needs the env-resolved default)
      scripts/
        backfill-contacts-2026-05-05.ts   # local-only, NOT shipped
      tsconfig.json             # NodeNext, noEmit, types:["node"]
      tsconfig.build.json       # extends base; emits to dist/
      package.json              # @jdickey1/mcp-google-contacts, public, bins, files allowlist
      LICENSE                   # MIT, copied from repo root if needed
      README.md                 # rewritten: write-scope-first, npm install primary, contributing secondary
      bun.lock                  # local dev convenience; not shipped
      dist/                     # build output, gitignored

claude-skills/                                    # public repo
  plugins/
    google-contacts-mcp/                          # NEW
      .claude-plugin/
        plugin.json             # mcpServers: { "google-contacts": { command: "npx", args: ["-y", "@jdickey1/mcp-google-contacts"] } }
      README.md                 # plugin-level docs, points at npm + private source repo
  .claude-plugin/
    marketplace.json            # appended: 20th plugin "google-contacts-mcp"
```

The implementer may adjust if implementation reveals a better layout — the per-unit `**Files:**` sections are authoritative.

---

## Implementation Units

### U1. Replace `Bun.spawnSync`, shebangs, error strings, and hardcoded account in shipped source

**Goal:** Remove every Bun runtime call and adopter-hostile string from files that ship in `dist/`. Two `Bun.spawnSync` sites, two shebangs, four user-visible error strings, one hardcoded personal email.

**Requirements:** R1, R3.

**Dependencies:** None.

**Repo:** `claude-skills-private`.

**Files:**
- Modify: `mcp-servers/google-contacts/src/keychain.ts` (1 spawn site + `KEYCHAIN_ACCOUNT` env-overridable resolution)
- Modify: `mcp-servers/google-contacts/src/index.ts` (shebang + cross-module imports)
- Modify: `mcp-servers/google-contacts/src/auth.ts` (cross-module imports + 3 error strings on lines 31, 39, 49)
- Modify: `mcp-servers/google-contacts/cli/auth.ts` (shebang, 1 spawn site, 1 error string on line 74)
- Verify only (no edits expected): `mcp-servers/google-contacts/src/tools.ts` — type-only `googleapis` import, no internal cross-module imports

**Approach:**
- `keychain.ts` — `defaultSpawn` rewrite: import `spawnSync` from `node:child_process`. Replace the call with `spawnSync("security", args, { encoding: "utf-8" })`. Critical: the public `SpawnLike` type returns `{ stdout: string; exitCode: number }` and `cli/auth.test.ts` asserts `exitCode` by name. Map Node's `result.status` (which is `number | null` on signal kill) to the existing `exitCode: number` field via `result.status ?? -1`. The shape change is invisible to consumers; do NOT switch the public field name to `status`.
- `keychain.ts` — `KEYCHAIN_ACCOUNT` fix: replace `export const KEYCHAIN_ACCOUNT = "james@jdkey.com";` with `export const KEYCHAIN_ACCOUNT = process.env.MCP_GOOGLE_CONTACTS_ACCOUNT ?? process.env.USER ?? "default";`. This mirrors Track 1's pattern. The hardcoded personal email currently ships in `dist/` and is the single most embarrassing PII leak in the artifact.
- `keychain.ts` — service prefix preservation: leave the three `cos-cron.google-contacts*` strings (lines 76, 81, 86) **untouched**. These are the actual current keychain identifiers; renaming invalidates existing user tokens. `cli/auth.test.ts:74-87` asserts them verbatim.
- `cli/auth.ts:83` (browser open): mirror Track 1's `openBrowser` pattern — three platform branches (`darwin` → `spawnSync("open", [url], ...)`, `win32` → `spawnSync("cmd", ["/c", "start", "", url], ...)`, else → `spawnSync("xdg-open", [url], ...)`). All three use `{ encoding: "utf-8", stdio: "ignore" }`. The current code is darwin-only; future-proofing for Linux adopters costs ~6 lines.
- Shebangs: `#!/usr/bin/env bun` → `#!/usr/bin/env node` in both `src/index.ts` and `cli/auth.ts`.
- Cross-module imports under `NodeNext`: `from "./auth.ts"` → `from "./auth.js"`, same for `./tools.js` and `./keychain.js`. Apply across `src/index.ts`, `src/auth.ts`, and (verify only) `src/tools.ts`. **Test files are also affected** — `cli/auth.test.ts` imports `../src/keychain.ts` (and `SpawnLike` as a type from the same path); flip to `.js` here too. Same for `src/tools.test.ts` if it imports source modules. Track 1 batched test-file `.ts → .js` flips into U1; do the same — keep U2 focused on the bun:test → node:test conversion.
- Error strings — **all four** Bun-flavored references in shipped source:
  - `src/auth.ts:31` — currently `"OAuth client_id not found in keychain. Run cli/auth.ts with..."` → replace with `"OAuth client_id not found in keychain. Run \`npx -p @jdickey1/mcp-google-contacts mcp-google-contacts-auth\` with..."`
  - `src/auth.ts:39` — currently `"OAuth client_secret not found in keychain. Run cli/auth.ts with..."` → same replacement pattern
  - `src/auth.ts:49` — currently `"Refresh token not found in keychain. Run \`bun run auth\` to authorize."` → `"Refresh token not found in keychain. Run \`npx -p @jdickey1/mcp-google-contacts mcp-google-contacts-auth\` to authorize."`
  - `cli/auth.ts:74` — currently the `console.error` block referencing `bun run auth` in the first-run usage example → replace the command line to `"  GOOGLE_OAUTH_CLIENT_ID=<id> GOOGLE_OAUTH_CLIENT_SECRET=<secret> npx -p @jdickey1/mcp-google-contacts mcp-google-contacts-auth"`

**Patterns to follow:**
- `claude-skills/mcp-servers/gmail/src/credential-store.ts` — three identical `Bun.spawnSync` → `spawnSync` conversions, exactly the shape needed here. Also the source of the `MCP_GMAIL_ACCOUNT ?? process.env.USER ?? "default"` pattern.
- `claude-skills/mcp-servers/gmail/cli/auth.ts:openBrowser` (lines 81-90) — the platform-aware browser-open block (darwin/win32/else→xdg-open).

**Test scenarios:**
- Happy path (verified once U2 lands): the existing keychain-touching tests in both test files pass against the converted `keychain.ts`. Behavior is preserved.
- Edge case: keychain miss (`security` exits non-zero). Existing tests cover this; assert `result.status ?? -1 → exitCode` mapping triggers the same error path.
- Edge case: signal kill of the `security` subprocess (`result.status === null`). Coalescing to `-1` preserves the public contract.
- Test expectation for this unit alone: source compiles via `tsc --noEmit` after U3 lands. No new test code in U1; existing test coverage is sufficient.

**Verification:**
- `grep -rn "Bun\." mcp-servers/google-contacts/src/ mcp-servers/google-contacts/cli/` returns zero.
- `grep -rn "#!/usr/bin/env bun" mcp-servers/google-contacts/` returns zero.
- `grep -rn "bun run auth" mcp-servers/google-contacts/src/ mcp-servers/google-contacts/cli/` returns zero.
- `grep -n "process.argv" mcp-servers/google-contacts/cli/auth.ts` returns zero — no CLI arg parsing for credentials (locks in the env-vars-only credential intake against future regression).
- `grep -n "james@jdkey.com" mcp-servers/google-contacts/` returns matches **only in `cli/auth.test.ts`** (test fixtures); zero matches in `src/`.
- `grep -n "cos-cron.google-contacts" mcp-servers/google-contacts/src/keychain.ts` returns the three constants unchanged (sanity-check the rename was NOT performed accidentally).
- All cross-module imports inside `src/` and `cli/` (including test files) use `.js` extensions.
- Error strings in `src/auth.ts` (lines 31, 39, 49) and `cli/auth.ts:74` reference `npx -p @jdickey1/mcp-google-contacts mcp-google-contacts-auth`, not `bun run auth` or `cli/auth.ts`.

---

### U2. Migrate `tools.test.ts` and `auth.test.ts` from `bun:test` to `node:test`

**Goal:** Both test files run under `tsx --test` against `node:test`. **All 28 tests** (21 in `src/tools.test.ts`, 7 in `cli/auth.test.ts`) green; coverage does not regress.

**Requirements:** R1, R8.

**Dependencies:** U1 (cross-module imports flipped, including in test files; `KEYCHAIN_ACCOUNT` env-overridable).

**Repo:** `claude-skills-private`.

**Files:**
- Modify: `mcp-servers/google-contacts/src/tools.test.ts` (487 LOC, 21 tests)
- Modify: `mcp-servers/google-contacts/cli/auth.test.ts` (88 LOC, 7 tests — note: this is a Keychain test, not a CLI test, despite the filename)

**Approach:**
- Replace `import { describe, expect, test, beforeEach } from "bun:test";` with `import { describe, test, beforeEach } from "node:test";` and `import assert from "node:assert/strict";`. (`expect` does not exist in `node:test` — every `expect` call must convert.)
- Type-only imports also flip extensions: `cli/auth.test.ts:9` has `import type { SpawnLike } from "../src/keychain.ts";` — change to `.js` (handled in U1, but verify here).
- **Mechanical assertion conversion** (extended beyond Track 1's table to cover patterns present in google-contacts):

  | bun:test | node:assert/strict |
  |----------|-------------------|
  | `expect(x).toBe(y)` | `assert.equal(x, y)` |
  | `expect(x).toEqual(y)` | `assert.deepEqual(x, y)` |
  | `expect(x).toHaveLength(n)` | `assert.equal(x.length, n)` |
  | `expect(x).toContain(item)` | `assert.ok(x.includes(item))` |
  | `expect(x).toBeTruthy()` | `assert.ok(x)` |
  | `expect(x).toBeDefined()` | `assert.notEqual(x, undefined)` |
  | `expect(x).toBeUndefined()` | `assert.equal(x, undefined)` |
  | `expect(x).toBeNull()` | `assert.equal(x, null)` (NOT `equal(x, undefined)` — strict treats them as different) |
  | `expect(x).not.toHaveProperty("k")` | `assert.equal(Object.hasOwn(x, "k"), false)` |
  | `expect(() => f()).toThrow(Type)` | `assert.throws(() => f(), Type)` |
  | `expect(() => f()).not.toThrow()` | `assert.doesNotThrow(() => f())` |
  | `expect(promise).rejects.toThrow(...)` | `await assert.rejects(promise, ...)` |

- **`toMatchObject` requires structural rewrite** — `node:assert/strict` has no clean equivalent on Node 20 (`partialDeepStrictEqual` is Node 22.4+, and the `engines` floor is `>=20`). For each `toMatchObject` site (verified at `src/tools.test.ts:247, 354, 391, 435`), hand-roll per-key `assert.equal` calls. This is NOT mechanical; budget time for ~4 sites, one of which has 5 fields.
- **`KEYCHAIN_ACCOUNT` test fixtures** — `cli/auth.test.ts:36, 77, 81, 85` currently assert `account: "james@jdkey.com"` verbatim. After U1's env-overridable change, the resolved default in the test environment is `process.env.USER`. Either: (a) set `process.env.MCP_GOOGLE_CONTACTS_ACCOUNT = "test-account"` in a `before()` hook and assert against that, or (b) import `KEYCHAIN_ACCOUNT` and assert against the constant rather than a literal string. Option (b) is cleaner — the test verifies "the constants point at whatever the resolved account is" rather than locking in a specific value.
- Imports of source modules use `.js` extensions (handled in U1).

**Execution note:** Run each test file under `tsx --test` after migration and fix failures one-by-one. The 4 `toMatchObject` sites are the only structural rewrites; everything else is mechanical.

**Patterns to follow:**
- `claude-skills/mcp-servers/gmail/src/tools.test.ts` — Track 1's conversion of a 19-test `bun:test` file to `node:test` (note Track 1 didn't hit `toMatchObject` so this pattern is new for Track 2).

**Test scenarios:**
- Happy path: `npx tsx --test mcp-servers/google-contacts/src/tools.test.ts` — every prior `tools.test.ts` case still passes (21 tests).
- Happy path: `npx tsx --test mcp-servers/google-contacts/cli/auth.test.ts` — every prior keychain test still passes (7 tests).
- Coverage parity: `grep -c "^\s*test(" <file>` returns 21 and 7 respectively, matching pre-migration counts.
- Edge case: signal-killed `security` subprocess produces `exitCode: -1` (the `?? -1` coalesce from U1) — keychain test that exercises non-zero exit still passes.
- Test expectation: 28 total tests run, all green.

**Verification:**
- `grep -rn "bun:test\|expect(" mcp-servers/google-contacts/src/ mcp-servers/google-contacts/cli/` returns zero.
- `grep -rn "toMatchObject\|toBeNull\|toBeDefined\|not.toHaveProperty\|not.toThrow" mcp-servers/google-contacts/` returns zero (all converted).
- Both test files green under `npx tsx --test <file>`.
- Test count preserved: `grep -c "^\s*test(" src/tools.test.ts` returns 21; `grep -c "^\s*test(" cli/auth.test.ts` returns 7.

---

### U3. Replace `tsconfig.json` with NodeNext base + add `tsconfig.build.json`

**Goal:** Typecheck cleanly with Node module resolution; emit a publishable `dist/` from a separate build config.

**Requirements:** R1, R2.

**Dependencies:** U1, U2 (cross-module imports must already use `.js` for NodeNext to resolve them).

**Repo:** `claude-skills-private`.

**Files:**
- Modify: `mcp-servers/google-contacts/tsconfig.json`
- Create: `mcp-servers/google-contacts/tsconfig.build.json`

**Approach:**
- Rewrite `tsconfig.json` to mirror `claude-skills/mcp-servers/gmail/tsconfig.json` exactly: `target: ES2022`, `module: NodeNext`, `moduleResolution: NodeNext`, `types: ["node"]`, `noEmit: true`, `isolatedModules: true`, `strict: true`, `noUncheckedIndexedAccess: true`, etc. Drop `allowImportingTsExtensions` (NodeNext requires `.js`-style import paths). Drop `types: ["bun"]`.
- Create `tsconfig.build.json` extending the base with `noEmit: false`, `outDir: "dist"`, `declaration: true`, `declarationMap: true`, `sourceMap: true`, `rootDir: "."`. Include `["src/**/*", "cli/**/*"]`; exclude `["src/**/*.test.ts", "cli/**/*.test.ts", "scripts/**", "node_modules", "dist"]`.

**Patterns to follow:**
- `claude-skills/mcp-servers/gmail/tsconfig.json` and `tsconfig.build.json` (copy-and-adapt; structurally identical).

**Test scenarios:**
- Test expectation: none — pure config. Verified indirectly via `tsc --noEmit` success in U4 verification and `tsc -p tsconfig.build.json` producing `dist/` in U4.

**Verification:**
- `npx tsc --noEmit` exits clean from `mcp-servers/google-contacts/`.
- `npx tsc -p tsconfig.build.json` produces `dist/src/index.js` and `dist/cli/auth.js` (among others). `dist/scripts/` does not appear (excluded). No `.test.js` files appear in `dist/`.

---

### U4. Rewrite `package.json` for npm publish

**Goal:** Package metadata that npm will accept and that gives consumers stable bins, a sane install surface, and a guard against broken publishes.

**Requirements:** R1, R2, R6, R7.

**Dependencies:** U3 (build config exists).

**Repo:** `claude-skills-private`.

**Files:**
- Modify: `mcp-servers/google-contacts/package.json`

**Approach:**
- Drop `"private": true`. **Keep `"type": "module"`** (already present at line 5; required for NodeNext ESM resolution at runtime — without it, `dist/src/index.js`'s `import` statements fail). Rename `name` to `@jdickey1/mcp-google-contacts`. Set `version` to `0.1.0` (bump to `0.1.1` if npm rejects).
- Set `main: "dist/src/index.js"`, `types: "dist/src/index.d.ts"`.
- `bin`: `{ "mcp-google-contacts": "dist/src/index.js", "mcp-google-contacts-auth": "dist/cli/auth.js" }`. The auth CLI's existing bin name (`cos-cron-google-auth`) is internal; replace with the public name.
- `files: ["dist/", "README.md", "LICENSE"]`. This is what excludes `src/`, `cli/`, `scripts/`, `bun.lock`, and tsconfigs from the npm tarball.
- `engines: { "node": ">=20" }`. Same floor as Track 1.
- `publishConfig: { "access": "public" }`. Required to publish a scoped package as public.
- `repository`: point at `https://github.com/jdickey1/claude-skills-private` with `directory: "mcp-servers/google-contacts"`. The repo URL is to a private repo; npm doesn't require the repo URL to be browsable, just well-formed. Adopters who follow the link without access will see GitHub's 404, which is acceptable. (Optional: omit `directory` and point at the public plugin path for a friendlier landing — defer to implementer preference.)
- `homepage`: point at the public marketplace plugin: `https://github.com/jdickey1/claude-skills/tree/main/plugins/google-contacts-mcp`.
- `bugs`: point at the public `claude-skills` issues page (since the source repo is private and adopters can't open issues there).
- `scripts`: `{ "auth": "tsx cli/auth.ts", "start": "tsx src/index.ts", "test": "tsx --test src/tools.test.ts cli/auth.test.ts", "typecheck": "tsc --noEmit", "build": "tsc -p tsconfig.build.json && chmod +x dist/src/index.js dist/cli/auth.js", "clean": "rm -rf dist", "prepublishOnly": "npm run clean && npm run typecheck && npm test && npm run build" }`. **Use explicit file paths in the test script, not globs** — Node 20's `--test` does not support glob expansion natively, and shell-expansion behavior depends on `globstar`. Listing both files explicitly is portable and matches the file inventory exactly. The `auth` and `start` scripts use `tsx`, not `bun run` — even though Bun is permitted locally, the canonical scripts ship to anyone who clones, and they should work without Bun.
- `dependencies`: keep `@modelcontextprotocol/sdk: ^1.0.0`, `googleapis: ^144.0.0`. Add `zod: ^3.23.0` if `src/index.ts` uses zod schemas (it does — verified in U1). Verify against the actual import set in `src/`.
- `devDependencies`: drop `@types/bun`. Add `@types/node: ^20.0.0`, `tsx: ^4.19.0`, keep `typescript: ^5.7.0`.
- `keywords`: `["mcp", "google-contacts", "model-context-protocol", "claude-code", "google-api"]`.

**Patterns to follow:**
- `claude-skills/mcp-servers/gmail/package.json` — exact structural mirror.

**Test scenarios:**
- Happy path: `npm pack --dry-run` from `mcp-servers/google-contacts/` lists only files under `dist/`, plus `README.md`, `LICENSE`, `package.json`. No `.ts`, no `bun.lock`, no `scripts/`, no tsconfigs.
- Happy path: `npm run prepublishOnly` runs end to end and produces `dist/` with executable bits on the bin files.
- Edge case: missing `LICENSE` → publish must fail loudly. Verified by running `prepublishOnly` and observing the build artifact set.
- Test expectation: behavior verified by `npm pack --dry-run` and `prepublishOnly`; no new unit tests needed.

**Verification:**
- `npm pack --dry-run` output matches the expected file list.
- **Positive scripts/ exclusion check**: `npm pack --dry-run 2>&1 | grep -c "scripts/"` returns `0`. Locks in the `files` allowlist's exclusion of internal `scripts/` content against future regression.
- `npm pack --dry-run 2>&1 | grep -E "\.test\.js|\.test\.ts"` returns zero — no test files in the tarball.
- `npm run prepublishOnly` exits 0 from a clean tree.
- `dist/src/index.js` and `dist/cli/auth.js` are executable (`stat -f %p` includes `x` bits).
- No `bun` substring in `dist/` (`grep -rn "bun" dist/` returns zero or only matches inside dependency code, not our source).
- No `james@jdkey.com` substring in `dist/` (`grep -rn "james@jdkey.com" dist/` returns zero — locks in the U1 hardcoded-email fix).

---

### U5. Rewrite README + add LICENSE

**Goal:** A README that leads with what the package does, what it changes (write surface), and how to install — not internal context. LICENSE must exist locally because npm only reads from the package directory.

**Requirements:** R5, R7.

**Dependencies:** None (can run in parallel with U1–U4 if files don't overlap; in practice serialize after U4 so the published bin/npm names are settled).

**Repo:** `claude-skills-private`.

**Files:**
- Modify: `mcp-servers/google-contacts/README.md`
- Create: `mcp-servers/google-contacts/LICENSE`

**Approach:**
- Copy the repo-root LICENSE if `claude-skills-private` has one; otherwise use MIT with `Copyright (c) 2026 James Dickey`. Match Track 1's `claude-skills/mcp-servers/gmail/LICENSE`.
- README structure (mirror Track 1 with write-surface adjustments):
  1. **Header** — what it is, one-paragraph why-it-exists, npm version badge.
  2. **Tools table** — all 6 tools, with each row noting "read" vs "write" in the description. The 5-tool README is stale; surface `update_contact` here.
  3. **OAuth scopes** — explicit named block. **All three scopes** must be listed verbatim (verified against `cli/auth.ts:17-21`):
     - `https://www.googleapis.com/auth/contacts.readonly` — primary contact read
     - `https://www.googleapis.com/auth/contacts.other.readonly` — read "Other contacts" (the implicit auto-saved set)
     - `https://www.googleapis.com/auth/contacts` — full contacts write (what `apply_label`, `remove_label`, `update_contact` use)
     Call out plainly: "the write scope grants the API permission to mutate any contact field; the tools choose to restrain themselves to label CRUD and selective field updates, but the **scope itself is not narrowed**." State this **before** the install instructions, not after.
  4. **Install: Option A (marketplace) / Option B (manual MCP config)** — same shape as Track 1.
  5. **Setup** — Google Cloud project, People API enable, Desktop OAuth client creation, run `npx -p @jdickey1/mcp-google-contacts mcp-google-contacts-auth`.
  6. **Credential storage** — keychain on macOS, file-backed elsewhere (verify against `src/keychain.ts` actual behavior — current code is keychain-only on macOS; if file-backed isn't implemented, document the macOS-only constraint instead of falsely claiming cross-platform). Footnote: "the keychain service prefix is `cos-cron.google-contacts.*` — internal substrate naming preserved across this migration to keep existing tokens valid; the prefix has no functional meaning to adopters."
  7. **Limitations** (NEW section) — explicitly note: no `MCP_GOOGLE_CONTACTS_*` env-var override layer for stored credentials in v1 (Track 1's gmail has one; this MCP doesn't yet). Adopters running in CI or containers must pre-populate the keychain or use a future minor version. The `MCP_GOOGLE_CONTACTS_ACCOUNT` env var **does** override the keychain account, defaulting to `process.env.USER`.
  8. **Design notes** — the write surface is intentional and tool-limited; no batch endpoints; idempotency notes for `apply_label`/`remove_label`.
  9. **Why a new MCP?** — same framing as Track 1 (community alternatives are abandoned, vendor auth, or expose unbounded write surface).
  10. **Contributing** — clone-and-develop instructions; this is where the source repo (`claude-skills-private`) is referenced. Adopters who don't have access can still consume the npm artifact. Include the Track 1 lockfile workaround: "If you have Bun installed locally, `bun install` works alongside `npm install`. Note: running `npm install` in this directory will delete `bun.lock`; restore it via `git checkout bun.lock` after."
- Strip every `cos-cron` (except the documented keychain-prefix footnote), `calwu GCP project`, and `bun run` reference from the public-facing sections.
- Normalize terminology: use "**write surface**" consistently throughout the README and avoid the synonyms ("write tools", "scoped writes") that drifted in earlier drafts. The detail phrases ("label CRUD + selective field updates") are clarifiers, not synonyms.

**Patterns to follow:**
- `claude-skills/mcp-servers/gmail/README.md` — direct structural mirror.

**Test scenarios:**
- Test expectation: none (pure docs). Sanity-checked by reading.

**Verification:**
- `grep -in "calwu\|bun run" README.md` returns zero.
- `grep -in "cos-cron" README.md` returns at most one match — the documented Credential storage footnote — and zero matches anywhere else.
- All 6 tools listed.
- All 3 OAuth scopes explicitly named (`contacts.readonly`, `contacts.other.readonly`, `contacts`).
- The phrase "full contacts write" or equivalent is present **before** the install instructions.
- npm install path is the primary route; clone-and-develop is in Contributing.
- Contributing section mentions the `bun.lock` deletion workaround (Track 1 incident).

---

### U6. Manual gate: `npm publish`

**Goal:** `@jdickey1/mcp-google-contacts@0.1.0` (or `0.1.1` if tombstoned) is live on the public npm registry.

**Requirements:** R1, R2.

**Dependencies:** U1–U5 all merged (or at least committed locally).

**Repo:** `claude-skills-private`.

**Files:** none modified — this is a publish step, not a code change.

**Approach:**

- **Pre-publish checklist** (run before `npm publish`):
  1. `npm whoami` returns `jdickey1`. If not, `npm login`.
  2. The `@jdickey1` npm account has **2FA enforced** for publish (check at `https://www.npmjs.com/settings/jdickey1/profile`). This is the highest-impact supply-chain control: a compromised account otherwise ships malicious code with full Google Contacts write access to every adopter on next `npx -y` invocation.
  3. The publish token (if used in CI rather than interactive auth) is a **granular token scoped to `@jdickey1` packages**, not the account root token. Track 1 may have used the root token; Track 2 should not perpetuate that.
  4. `prepublishOnly` ran clean in a previous step (the chain runs again automatically on `npm publish`, but a green dry run de-risks the actual publish).
- **Publish command**: `npm publish --provenance` if running in a supported CI environment (GitHub Actions with `id-token: write`); otherwise plain `npm publish`. Provenance attaches a verifiable build attestation that adopters can later check via `npm audit signatures`. Don't block on provenance for an interactive publish — the 2FA control is the load-bearing protection.
- If the registry rejects with E403 "cannot publish over previously published versions" (Track 1 hit this on `0.1.0`), bump the version in `package.json` to `0.1.1`, commit, and re-run.
- After publish, the registry's read-side replicas may take a few minutes to propagate. `npm view @jdickey1/mcp-google-contacts version` returning 404 immediately after a successful publish is normal lag, not failure. The publish output is authoritative.
- **Smoke test** (correct pattern — `npm pack --dry-run` produces a *report*, not a tarball, so the previous suggestion would not work):
  - Option A (post-publish, simplest): `npx -y @jdickey1/mcp-google-contacts < /dev/null` — the package downloads from the registry and the bin runs. Empty stdin causes a clean MCP-protocol exit. We're checking "the package downloads and the bin runs without a missing-module crash", not protocol correctness.
  - Option B (local pre-publish): `npm pack` (real, produces `@jdickey1-mcp-google-contacts-0.1.0.tgz`), `tar -xzf @jdickey1-mcp-google-contacts-0.1.0.tgz`, `node package/dist/src/index.js < /dev/null`.

**Execution note:** This is a one-way action. Once `0.1.x` is published, that exact version is permanently reserved in the registry (tombstoned even after unpublish for 24h). Confirm `prepublishOnly` ran clean before invoking `npm publish`.

**Patterns to follow:**
- Track 1 publish flow (Track 1's plan and the realized commit `d9a1ee7`).

**Test scenarios:**
- Happy path: `npm publish` outputs `+ @jdickey1/mcp-google-contacts@0.1.x`.
- Edge case (tombstone): bump to `0.1.1` and retry.
- Smoke: `npx -y @jdickey1/mcp-google-contacts` (after registry propagates) boots the server. May fail without OAuth credentials in the env; that's expected — what we're checking is "the package downloads and the bin runs without a missing-module crash."

**Verification:**
- Publish output confirms the version.
- (After ~5–15 min) `npm view @jdickey1/mcp-google-contacts version` returns the published version.
- Smoke boot does not crash with `Cannot find module` or similar packaging errors.

---

### U7. Create the `google-contacts-mcp` plugin shell in `claude-skills` (public)

**Goal:** Plugin manifest that auto-wires the MCP server when a user installs the plugin from the public marketplace.

**Requirements:** R4, R5.

**Dependencies:** U6 (the npm package must exist for `npx -y` to succeed).

**Repo:** `claude-skills` (public).

**Files:**
- Create: `plugins/google-contacts-mcp/.claude-plugin/plugin.json`
- Create: `plugins/google-contacts-mcp/README.md`

**Approach:**
- `plugin.json`:
  ```json
  {
    "name": "google-contacts-mcp",
    "description": "Google Contacts MCP server. Six tools: search_contacts, get_contact, list_label_groups, apply_label, remove_label, update_contact. Grants OAuth scopes contacts.readonly, contacts.other.readonly, and contacts (full write) — the write surface is tool-limited to label apply/remove and selective field updates, but the scope grant itself is not narrowed. OAuth credentials live in the OS keychain (macOS); no tokens in your config.",
    "author": { "name": "James Dickey", "url": "https://github.com/jdickey1" },
    "homepage": "https://github.com/jdickey1/claude-skills/tree/main/plugins/google-contacts-mcp",
    "mcpServers": {
      "google-contacts": {
        "command": "npx",
        "args": ["-y", "@jdickey1/mcp-google-contacts"]
      }
    }
  }
  ```
- The `description` surfaces the write surface and **all three** scopes explicitly per R5. Naming `contacts (full write)` directly — rather than the softer "scoped writes" — is what closes the disclosure gap: an installer reading the listing understands the actual grant, not the tools' self-imposed restraint.
- README mirrors `claude-skills/plugins/gmail-mcp/README.md`: tools table (all 6), **all 3 OAuth scopes** named verbatim, one-time setup walkthrough pointing back at the (private) source repo for full setup, credential storage (note macOS-only keychain in v1, no file-backed fallback), source pointer, caveats. Note that the source repo is private — adopters can read everything via npm (`npm pack` extracts the JS) but the git source is closed.

**Patterns to follow:**
- `claude-skills/plugins/gmail-mcp/.claude-plugin/plugin.json` — exact manifest shape.
- `claude-skills/plugins/gmail-mcp/README.md` — exact README shape.

**Test scenarios:**
- Test expectation: none for the plugin shell itself (it's pure config); end-to-end install verification is deferred to U8 verification.

**Verification:**
- `plugin.json` is valid JSON; the `mcpServers.google-contacts.command` and `args` fields match the npm bin from U4.
- README has all 6 tools and explicitly names **all 3** OAuth scopes (`contacts.readonly`, `contacts.other.readonly`, `contacts`).
- The literal phrase `contacts (full write)` (or equivalent that names the scope) appears in both `plugin.json`'s description and the README's scope block.
- `homepage` URL resolves to the new plugin directory in `claude-skills`.

---

### U8. Register the plugin in `claude-skills/.claude-plugin/marketplace.json`

**Goal:** Marketplace listing exposes `google-contacts-mcp` as the 20th plugin alongside `gmail-mcp`.

**Requirements:** R4, R5.

**Dependencies:** U7.

**Repo:** `claude-skills` (public).

**Files:**
- Modify: `.claude-plugin/marketplace.json`

**Approach:**
- Append a new plugin entry after the existing `gmail-mcp` entry. The description must name the literal `contacts` scope so an installer reading the marketplace index — which is the listing surface, often skimmed faster than the README — understands the grant before clicking install:
  ```json
  {
    "name": "google-contacts-mcp",
    "description": "Google Contacts MCP server. Six tools (search, get, list labels, apply label, remove label, update contact). Grants OAuth scopes contacts.readonly + contacts.other.readonly + contacts (full write); mutations are tool-limited to label CRUD and selective field updates. OAuth credentials live in the macOS keychain — no tokens in your config.",
    "source": "./plugins/google-contacts-mcp",
    "category": "productivity",
    "homepage": "https://github.com/jdickey1/claude-skills"
  }
  ```
- Validate JSON. Confirm 20 unique plugin names. Confirm the file still parses with a JSON validator (or `jq . marketplace.json > /dev/null`).

**Patterns to follow:**
- `claude-skills/.claude-plugin/marketplace.json` — the 19th entry (`gmail-mcp`) is the closest precedent. Mirror keys exactly.

**Test scenarios:**
- Happy path: `jq '.plugins | length' .claude-plugin/marketplace.json` returns `20`.
- Happy path: `jq '.plugins | map(.name) | unique | length' .claude-plugin/marketplace.json` returns `20` (no duplicates).
- Edge case: every entry still has `name`, `description`, `source`, `category`, `homepage`.
- End-to-end (manual, post-merge): install the plugin from the marketplace in a fresh Claude Code session; restart; `tools/list` includes the 6 google-contacts tools. Defer past merge to main.

**Verification:**
- `jq` checks above pass.
- The new entry's `source` path (`./plugins/google-contacts-mcp`) exists.
- A spot-check `cat` of the entry confirms shape parity with `gmail-mcp`.

---

### U9. Fix Track 1 leftover `bun run auth` strings in gmail and republish `0.1.2` — **SHIP FIRST**

**Goal:** `@jdickey1/mcp-gmail` no longer tells end users to run a Bun command. Three error strings in `src/auth.ts` get the same `npx -p @jdickey1/mcp-gmail mcp-gmail-auth` treatment Track 2 applies to google-contacts, and a `0.1.2` republish carries the fix to npm consumers.

**Requirements:** R9.

**Dependencies:** None — fully independent of U1–U8. **Recommended sequencing: ship FIRST, before U1.** Two reasons:
1. **Adopter impact, now**: gmail `@jdickey1/mcp-gmail@0.1.1` is live on npm right now telling every user with a missing-token error to run a Bun command they probably don't have. Every day of delay is broken UX for live adopters.
2. **De-risk Track 2**: U9 exercises the same `prepublishOnly` + `npm publish` motion U6 needs. Running it on a known-good package (gmail, already shipped once) before betting it on a brand-new package (google-contacts, never published) catches any local environment / npm-account / 2FA / token issues before they block U6. Track 1's tombstone incident on `0.1.0` was a publish-flow surprise; U9-first prevents the same class of surprise from blocking Track 2.

(The previous plan version recommended "ship after U8 to avoid a half-finished marketplace state" — inverted reasoning; U9 doesn't touch the marketplace at all and is in a different package.)

**Repo:** `claude-skills` (public). Gmail source lives in the public `claude-skills` repo (unlike google-contacts source, which is in `claude-skills-private`); this asymmetry is real, not a typo.

**Current gmail published version:** `0.1.1` (verified via `npm view @jdickey1/mcp-gmail version`). This unit bumps to `0.1.2`.

**Files:**
- Modify: `mcp-servers/gmail/src/auth.ts` (3 error strings on lines 41, 51, 61 — verify line numbers before editing; the file may have shifted)
- Modify: `mcp-servers/gmail/package.json` (`version: "0.1.1"` → `"0.1.2"`)
- Modify: `mcp-servers/gmail/src/index.ts` (`SERVER_VERSION` constant on line 14 — verified to track the package version; bump to `"0.1.2"`)

**Approach:**
- Replace each `Run \`bun run auth\` with ...` substring with `Run \`npx -p @jdickey1/mcp-gmail mcp-gmail-auth\` with ...` (or the equivalent phrasing for the "to authorize" message). Keep the surrounding error context intact — only the command-name substring changes.
- Bump `package.json` `version` to `0.1.2`. Bump `SERVER_VERSION` in `src/index.ts` to match.
- Run `npm run prepublishOnly` to confirm the build still succeeds with the new strings (it will — they're in user-facing error messages, not in any test assertion).
- Run U6's pre-publish checklist (2FA, granular token, `npm whoami`) against the gmail package before `npm publish`. The version is fresh, so no tombstone risk.

**Patterns to follow:**
- The U6 publish flow in this plan applies one-for-one to gmail's `0.1.2` publish.

**Test scenarios:**
- Happy path: `grep -n "bun run auth" mcp-servers/gmail/src/` returns zero after the edit.
- Happy path: `npm publish` outputs `+ @jdickey1/mcp-gmail@0.1.2`.
- Edge case: a future `npx -y @jdickey1/mcp-gmail` install (after registry propagates) booted without OAuth env vars produces error messages that reference `npx -p @jdickey1/mcp-gmail mcp-gmail-auth`, not `bun run auth`. Manual smoke after publish.
- Test expectation: existing 19 tests still pass under `tsx --test` — the strings aren't asserted against.

**Verification:**
- `grep -rn "bun run" mcp-servers/gmail/src/ mcp-servers/gmail/cli/` returns zero.
- `npm view @jdickey1/mcp-gmail version` (after propagation) returns `0.1.2`.
- A scratch boot of the published `0.1.2` artifact with empty env produces the new error strings.

---

## System-Wide Impact

- **Interaction graph:** None inside the runtime — this is a packaging migration. The MCP's tool surface to Claude Code clients is unchanged.
- **Error propagation:** Error strings inside `src/auth.ts` (lines 31, 39, 49) and `cli/auth.ts:74` change from Bun-era invocations → `npx -p @jdickey1/mcp-google-contacts mcp-google-contacts-auth`. This is user-facing — verify the new strings render correctly when the MCP boots without credentials and when the user runs the CLI without env vars.
- **State lifecycle risks:** Keychain entries are stored under the prefix `cos-cron.google-contacts.*` (three constants: `cos-cron.google-contacts`, `cos-cron.google-contacts.client_id`, `cos-cron.google-contacts.client_secret`) with account `KEYCHAIN_ACCOUNT`. U1 preserves the prefix verbatim (`cli/auth.test.ts` asserts the strings) but **changes the account resolution** from hardcoded `"james@jdkey.com"` to env-overridable (`MCP_GOOGLE_CONTACTS_ACCOUNT ?? USER ?? "default"`). For the **author's existing tokens on the Mac Mini**, this means they remain reachable as long as `process.env.USER` resolves to whatever value was previously hardcoded — but for the author specifically, `USER=james` not `james@jdkey.com`, so existing tokens become unreachable unless `MCP_GOOGLE_CONTACTS_ACCOUNT=james@jdkey.com` is set. Action: in the cos-cron MCP config flip (deferred follow-up), pin `MCP_GOOGLE_CONTACTS_ACCOUNT=james@jdkey.com` in the env block, OR re-auth once locally to populate keychain under the new account. New adopters are unaffected — they auth fresh under the new default account.
- **API surface parity:** The `bin` rename from `cos-cron-google-auth` to `mcp-google-contacts-auth` is a breaking change to anyone who scripted the old name. Acceptable: the package was `private: true` and the only consumer was cos-cron's local config. Document in the cos-cron migration follow-up.
- **Integration coverage:** `npx -y @jdickey1/mcp-google-contacts` end-to-end install path is untested until U8 plus a manual smoke after merge. The Track 1 precedent showed this works; the same registry behavior applies. Worth one manual smoke before declaring the marketplace install path proven.
- **Unchanged invariants:** Keychain service prefix (`cos-cron.google-contacts.*` — preserved), OAuth scopes (all three: `contacts.readonly`, `contacts.other.readonly`, `contacts`), all 6 tool input/output shapes, and the read/write tool boundary. **Changed**: keychain account (now env-overridable) and bin name (now public). **Not present in v1**: a Track-1-equivalent `EnvOverrideStore` layer (`MCP_GOOGLE_CONTACTS_*` env vars overriding stored credentials) — explicitly deferred per Open Questions; documented as a v1 limitation in U5.

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Keychain service prefix accidentally renamed (`cos-cron.google-contacts.*` → `mcp-google-contacts.*`) during migration, invalidating every existing user's stored tokens | U1 verification grep: `grep -n "cos-cron.google-contacts" src/keychain.ts` must return the three constants unchanged. `cli/auth.test.ts` asserts the literal strings; a mistaken rename fails the test suite. |
| Hardcoded `KEYCHAIN_ACCOUNT = "james@jdkey.com"` ships to npm, leaking PII and rendering the package unusable to anyone but the author | U1 replaces with `process.env.MCP_GOOGLE_CONTACTS_ACCOUNT ?? process.env.USER ?? "default"`. U2 updates test fixtures to assert against the constant rather than the literal string. U4 verification grep on `dist/` blocks the literal email from ever reaching the registry. |
| `bun:test` patterns `toMatchObject`/`toBeNull`/`not.toThrow`/`toBeDefined`/`not.toHaveProperty` don't translate mechanically; `toMatchObject` has no Node 20 equivalent | U2's extended conversion table covers them. `toMatchObject` (4 sites) gets hand-rolled per-key `assert.equal`; budget extra time. |
| `Bun.spawnSync.exitCode` → Node `result.status` mismatch breaks the public `SpawnLike` type contract that `cli/auth.test.ts` relies on | U1 explicitly maps `result.status ?? -1 → exitCode`, preserving the field name. The `?? -1` coalesces signal-kill (`status: null`) into the existing exit-code semantics. |
| `tsx --test` glob expansion silently matches no files on Node 20 (glob support is Node 21+) | U4 uses explicit file paths in the `test` script (`tsx --test src/tools.test.ts cli/auth.test.ts`), not globs. |
| `update_contact` exists in `src/index.ts` but missing from the README — reviewer thinks it's a 5-tool MCP | Explicit R7 requirement; U5 README rewrite must list all 6. Verify `src/index.ts` registration count matches the README count before merge. |
| `auth.test.ts` filename suggests it tests CLI exit codes, leading an implementer to chase phantom subprocess-shape issues | Plan now explicitly notes this is a Keychain test (88 LOC, 7 tests on `Keychain` from `../src/keychain`), not a CLI test. U2 treats the migration as purely mechanical assertion rewrites with no subprocess concerns. |
| Compromised `@jdickey1` npm account ships malicious code with full `contacts` write scope to every adopter on next `npx -y` invocation | U6 pre-publish checklist: 2FA enforced, granular publish token scoped to `@jdickey1`, `--provenance` when CI supports it. Highest-impact supply-chain control. |
| `marketplace.json` "scoped writes" framing understates the actual `contacts` scope grant; installer skims past the disclosure | U8 description names the literal scope string `contacts (full write)`. R5 elevates this from README-only to all three listing surfaces (README, plugin.json, marketplace.json). |
| cos-cron's local MCP config breaks after we rename the bin AND after the keychain account default changes | Deferred follow-up explicitly tracks both: bin rename in `~/.claude.json`, and either pin `MCP_GOOGLE_CONTACTS_ACCOUNT=james@jdkey.com` or re-auth once to populate the keychain under the new default. |
| Forgotten gmail `0.1.2` republish keeps adopters seeing the broken `bun run auth` error message | U9 is now an explicit unit and **the first to ship**. Verification step confirms the new strings are live on the published `0.1.2` artifact. |

---

## Documentation / Operational Notes

- After merge to `claude-skills-private` main and a successful `npm publish`, post a short note in `obsidian-vault:project-status/in-house-mcps.md` (or the equivalent project-status doc) recording the version, date, and the Track 1 + Track 2 pair as the established pattern for future in-house MCPs.
- Update the auto-memory entry `feedback-prefer-official-or-direct-mcps.md` with a one-line update: "Track 2 (google-contacts) shipped 2026-05-XX; pattern reusable for any future in-house MCP."
- One week after publish, flip the cos-cron MCP config (separate small PR/commit on the Mac Mini's `~/.claude.json`).

---

## Sources & References

- **Track 1 plan (closest prior art):** `claude-skills/docs/plans/2026-05-06-001-feat-gmail-mcp-marketplace-plan.md`
- **Track 1 merge commit:** `claude-skills` `4a37f44` (PR #23)
- **Track 1 npm artifact:** [@jdickey1/mcp-gmail on npm](https://www.npmjs.com/package/@jdickey1/mcp-gmail)
- **MCP server source (target of this plan):** `claude-skills-private:mcp-servers/google-contacts/`
- **Stale README to be rewritten:** `claude-skills-private:mcp-servers/google-contacts/README.md` (lists 5 tools, references cos-cron and bun run)
- **Memory anchor:** `~/.claude/projects/-Users-james/memory/feedback-prefer-official-or-direct-mcps.md`
