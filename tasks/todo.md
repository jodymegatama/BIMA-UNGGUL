# Task List: MySQL Case-Sensitive Migration CI Failure

- [x] Task 1: Audit all table identifiers in `sync_schema_drift/migration.sql` and validate the lookup assumptions against `schema.prisma`.
- [x] Task 2: Confirm CI runs MySQL 8.4 with Linux case-sensitive table-name behavior and that migration plus drift checks remain required.
- [x] Task 3: Reject ambiguous case-folded table names and cover the guard with a regression test.

## Checkpoint

- [x] Review findings before any implementation.
- [x] Follow-up ambiguity guard added locally; verify applied-migration checksums before deployment.
