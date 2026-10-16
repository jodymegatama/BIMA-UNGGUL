# Implementation Plan: Tailwind Oxide Linux CI Build Failure

## Overview

Prevent recurrence of the frontend CI build failure caused by a missing Linux-native Tailwind Oxide package in the npm lockfile. The Linux correction from commit `b483e05` is already present, and CI run #5 on `cf6d4fd` passed both frontend and backend jobs. The audit also found one pre-existing Windows x64 Oxide entry without a registry URL or integrity hash; this follow-up fills that metadata and adds a regression test without changing dependency versions.

## Current State

- `frontend/package.json` uses Tailwind CSS and `@tailwindcss/postcss` 4.x.
- Root `package-lock.json` is used by both workspace jobs; CI runs `npm ci` on `ubuntu-latest` with Node.js 22, then frontend lint, tests, and build.
- Commit `b483e05` added the optional Oxide platform package entries, including `@tailwindcss/oxide-linux-x64-gnu` at version 4.3.3, with registry integrity and platform metadata.
- The package-lock audit confirmed all 12 optional platform package entries and version pins match the official Oxide 4.3.3 manifest. The pre-existing Windows x64 entry lacked `resolved` and `integrity`; those values have now been added from npm registry metadata.
- CI run #5 for commit `cf6d4fd` passed the frontend build and backend job.
- The repository already has completed work recorded in `tasks/plan.md` and `tasks/todo.md`; this issue uses separate files so that history remains intact.

## Goal

Make omissions or inconsistent metadata for Tailwind Oxide's platform-specific optional dependencies detectable before they cause a Linux CI build failure.

## Design Decisions

- Keep using the committed root lockfile and the existing `npm ci` workflow. npm documents `npm ci` as a frozen install that requires a matching lockfile and does not rewrite it.
- Keep platform packages optional and rely on their `os`, `cpu`, and (where applicable) `libc` metadata so npm installs the matching binary on Linux while skipping packages for other platforms.
- Do not set `--omit=optional` in CI because the native Oxide binding is optional at package-resolution level but required for this build environment.
- Do not update Tailwind/npm versions as part of this follow-up; make only the smallest lockfile correction and regression check that protect the known failure.
- Treat the successful CI run on `cf6d4fd` as validation of the existing correction. Re-run CI only after any new change is proposed and reviewed.

## Tasks

### Task 1: Audit the existing lockfile correction

**Description:** Compare `frontend/node_modules/@tailwindcss/oxide`'s declared optional platform dependencies with the corresponding entries in the root `package-lock.json`. Confirm the Linux x64 glibc runner binding has matching version, registry integrity, `optional: true`, and `os`/`cpu`/`libc` restrictions. Review the frontend workflow to confirm it installs from the root lockfile with `npm ci` and does not omit optional dependencies.

**Acceptance criteria:**
- [x] Every platform package required by the pinned Oxide version is represented in the root lockfile with matching version and optional/platform metadata.
- [x] The Ubuntu runner's Linux x64 glibc package is present and resolves to the same Oxide version as its parent dependency.
- [x] CI does not set an npm option that omits optional packages.
- [x] The pre-existing Windows x64 entry now has its registry URL and integrity hash.

**Verification:** Compared the Oxide 4.3.3 manifest and package dist metadata from the npm registry with the root lockfile; reviewed the frontend workflow. The target Linux binding already matched; the missing Windows x64 URL/hash was filled from the registry response.

**Dependencies:** None.

**Files likely touched:** None (read-only audit).

**Estimated scope:** Small.

### Task 2: Add a lockfile regression check if the audit confirms a maintainable invariant

**Description:** Add a small automated check that catches missing platform-package entries or version/metadata drift between the Oxide parent package and the lockfile. Keep it scoped to the pinned dependency metadata and avoid duplicating npm's entire resolver.

**Acceptance criteria:**
- [x] The check fails if a platform package entry is missing, version-mismatched, or lacks a registry URL, optional flag, or integrity hash.
- [x] The check verifies the Linux x64 glibc package's version, optional flag, integrity, and platform metadata against the pinned Oxide version.
- [x] The check passes on the current lockfile without changing dependency versions.

**Verification:** The focused test failed during the audit because the Windows x64 entry lacked an integrity hash; after adding its registry URL/hash, the focused test passed (2 tests). Full frontend suite passed (74 tests), frontend lint passed, and Vite production build passed locally; CI remains the platform-specific verification.

**Dependencies:** Task 1.

**Files likely touched:**
- `package-lock.json` (only if the audit finds a real metadata gap)
- A focused script or test under the repository's existing test conventions
- `.github/workflows/ci.yml` only if a dedicated check needs a workflow step

**Estimated scope:** Small to medium.

### Task 3: Validate on the CI platform

**Description:** Confirm the updated branch runs the existing Ubuntu workflow with clean `npm ci`, frontend lint, tests, and production build. Preserve the current platform and Node.js version so the check exercises the actual failure environment.

**Acceptance criteria:**
- [ ] The run is associated with the commit containing the regression check.
- [ ] Frontend install, lint, tests, and build all pass on `ubuntu-latest` / Node.js 22.
- [ ] The backend job remains green, confirming the lockfile-only or test addition did not affect the workspace install.

**Verification:** Inspect the run and both job conclusions in GitHub Actions.

**Dependencies:** Task 2.

**Files likely touched:** None beyond Task 2.

**Estimated scope:** Small.

## Checkpoints

### After Task 1
- [x] Confirm the current binding metadata matches the pinned Oxide release.
- [x] Decide that a dedicated lockfile regression check is maintainable.

### Completion
- [x] Regression check passes locally.
- [ ] CI for the resulting commit passes frontend build and backend jobs.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| A hand-maintained test duplicates upstream optional-dependency metadata and becomes brittle on upgrades | Medium | Derive expected platform package names from the exact pinned Oxide package metadata instead of hard-coding every future platform/version. |
| A local Windows install hides a Linux-only omission | High | Keep Ubuntu `npm ci` and build as the final required verification. |
| Omitting optional dependencies makes the native build fail again | High | Preserve the current CI install command and explicitly check no `omit=optional` config is active. |
| The known failure has already been fixed and CI passes | Low | Treat this as an optional hardening plan; do not make redundant lockfile changes. |

## Open Questions

- Does Task 1 show that a dedicated lockfile regression check is maintainable, or should the existing Linux CI install/build remain the sole guard?

## Documentation Sources

- Context7 `/npm/cli`: `npm ci` uses a lockfile for a frozen install; optional dependencies are represented in the lockfile and platform-incompatible optional packages are skipped by npm.
- Context7 `/websites/tailwindcss`: Tailwind v4's PostCSS integration uses the `@tailwindcss/postcss` package; the docs do not specify Oxide's full native platform matrix, so exact package metadata must be checked for the pinned release.
- npm registry metadata for `@tailwindcss/oxide` and `@tailwindcss/oxide-win32-x64-msvc`, version 4.3.3.
- Repository evidence: commit `b483e05`; GitHub Actions run #5 for `cf6d4fd`.
