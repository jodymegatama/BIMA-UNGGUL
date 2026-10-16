# Implementation Plan: MySQL Case-Sensitive Migration CI Failure

## Status

Completed: the ambiguity guard and regression test were added locally after the read-only audit. No CI configuration change was needed.

## Context

The first CI run failed in `Apply migrations` because the migration used lower-case table identifiers such as `indikator`, while MySQL on Linux preserved the Prisma table name `Indikator` and treated the names as case-sensitive. MySQL's `lower_case_table_names` defaults differ by platform: `0` on Unix/Linux and `1` on Windows. The project workflow uses MySQL 8.4 on `ubuntu-latest`.

The current branch is `master` at `b41e799`, where commit `160872a` already changes the migration to look up actual table names through `INFORMATION_SCHEMA.TABLES`. CI run #4 passed on this commit. A follow-up requested a guard for case-folded names that match more than one table; that guard and a regression test are now in the local working tree.

## Goal

Keep the schema drift migration working on Linux's case-sensitive MySQL and prevent CI from silently losing coverage of that behavior.

## Design Decisions

- Preserve the database's real table-name casing when generating DDL; do not set CI to `lower_case_table_names=1` just to imitate Windows, because that would hide the Linux failure mode.
- Verify every executed DDL statement in the migration uses the discovered table name, not a hard-coded lower-case spelling.
- Reuse the existing CI path that initializes a clean MySQL database, applies Prisma migrations, and checks schema drift. Add an explicit case-mode assertion only if inspection shows the current setup does not make the Linux mode clear or stable.
- Before changing a migration file again, check whether it has been applied in any shared database. If it has, prefer a follow-up migration over changing an already-applied migration checksum.

## Tasks

### Task 1: Audit the existing migration's identifier handling

**Description:** Review `sync_schema_drift/migration.sql` end to end and confirm all table-level DDL resolves the actual table name from the current schema before constructing SQL. Check that lookup assumptions are valid for the project's schema and that identifiers are quoted safely.

**Acceptance criteria:**
- [x] No executed DDL references a lower-case table name directly where the actual table name may differ by case.
- [x] Lookups are scoped to the active database; the current Prisma schema has one expected table per case-insensitive lookup.
- [x] No migration edit was proposed, so no applied migration checksum was changed.

**Verification:** Static review of the migration and its Prisma schema; no database mutation during this audit.

**Dependencies:** None.

**Files likely touched:**
- `backend/prisma/migrations/20261002153000_sync_schema_drift/migration.sql`
- `backend/prisma/schema.prisma`

**Estimated scope:** Small.

### Task 3: Reject ambiguous case-folded table names

**Description:** Remove the row limit from every scalar `@t` lookup. A single match yields the actual table name, no match yields `NULL`, and multiple case-folded matches cause MySQL error 1242 instead of selecting an arbitrary table.

**Acceptance criteria:**
- [x] Every table-name lookup is scoped to the active schema and has no `LIMIT` that could hide duplicate case-folded names.
- [x] A regression test fails if a future edit reintroduces a limited or unscoped table lookup.
- [x] The test, backend suite, and backend lint pass.

**Verification:** Focused regression test passed after a confirmed RED result; backend suite passed (96 passed, 6 skipped); backend lint passed. No migration was run against a database.

**Dependencies:** Tasks 1 and 2.

**Files touched:**
- `backend/prisma/migrations/20261002153000_sync_schema_drift/migration.sql`
- `backend/tests/migrationCaseAmbiguity.test.js`

**Estimated scope:** Small.

### Task 2: Confirm the regression check exercises Linux case sensitivity

**Description:** Review the CI MySQL service and migration steps. Confirm the clean database is initialized on Linux with `lower_case_table_names=0`, then keep `prisma:deploy` and the schema drift gate as required checks. Add an explicit mode assertion only if it can be done without masking or changing the platform behavior.

**Acceptance criteria:**
- [x] `ubuntu-latest` plus the MySQL 8.4 service uses MySQL's documented Unix default, `lower_case_table_names=0`.
- [x] The current migration succeeds from a clean database on the matching CI configuration (run #4).
- [x] The schema drift check remains a required workflow step after migrations, and run #4 passed.

**Verification:** Reviewed `.github/workflows/ci.yml` and the existing CI run #4 on `b41e799`; the migration and schema-drift steps both passed. No new migration or test command was run.

**Dependencies:** Task 1.

**Files likely touched (only if a guard is needed):**
- `.github/workflows/ci.yml`
- A small backend CI helper script, if required by the runner environment.

**Estimated scope:** Small.

## Checkpoint

- [x] Review the Task 1 audit findings.
- [x] Confirm the workflow in Task 2 runs with the documented Linux default `lower_case_table_names=0`.
- [x] The requested ambiguity guard and its regression test are implemented locally.

## Risks and Open Questions

- The raw failed-run log archive was unavailable through the unauthenticated local GitHub CLI/API session. The failure cause is supported by the migration's explicit error comment, the follow-up fix in `160872a`, and the passing run #4.
- The guard deliberately fails with MySQL error 1242 on multiple matches. The raw failed-run log archive was unavailable through the unauthenticated local GitHub CLI/API session; the original CI cause remains supported by the migration comment, follow-up fix, and passing run #4.
- This change modifies an existing Prisma migration. Before deploying it, verify whether the migration has been applied in shared or production databases; an applied migration's checksum may differ. No migration or deployment was run here.
- The workflow relies on the documented Linux default rather than asserting the variable explicitly. It currently exercises the case-sensitive mode; a future runner/service change should preserve that behavior.

## Documentation Source

- MySQL 8.4 Reference Manual, Identifier Case Sensitivity and `lower_case_table_names`: https://dev.mysql.com/doc/refman/8.4/en/identifier-case-sensitivity.html
- Context7 library used: `/websites/dev_mysql_doc`.
- MySQL prepared-statement/scalar-subquery behavior reviewed with Context7; Vitest matcher behavior reviewed with `/vitest-dev/vitest`.
