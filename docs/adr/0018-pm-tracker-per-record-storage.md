# ADR-0018: pm-tracker data is stored per record, with a revision on every write

- **Status**: Accepted
- **Date**: 2026-09-23
- **Deciders**: Backend team

## Context and Problem Statement

The pm-tracker web app saved a user's whole state as one JSONB blob
(`pm_tracker_state.data`) with a full-replace `PUT /pm-tracker/state`. Every save
uploaded everything (several MB), and whichever save arrived last won. An older tab,
a second device, or a save that was still in flight after a sync could overwrite newer
data, and that is how issues repeatedly "disappeared" after a reload. The upload size
also hit body limits, and the full-blob write kept a multi-MB copy in memory on every save.

## Decision Outcome

**A user's data is a set of records, each with its own revision. A write lands only
if it names the record's current revision.**

- **Records**
  - One row per task in `pm_tracker_task`. The table already existed as a search
    mirror; now it is the source of truth.
  - One row per top-level settings section in `pm_tracker_doc`, keyed by name
    (`developers`, `projects`, `jiraConnections`, `schedule`, ...).
  - Deleted tasks leave a row in `pm_tracker_tombstone`.
- **Revisions** come from one global sequence, `pm_tracker_revision_seq`. Every write
  stamps the record with `nextval`, so a revision is both the record's version and a
  cursor for "what changed since".
- **Writes** (`POST /pm-tracker/records/commit`)
  - The client sends only the records it changed, each with the revision it started
    from (`null` when creating one).
  - Each write is a compare-and-set in SQL (`UPDATE ... WHERE revision = $base`).
  - A write that does not match comes back as a conflict with the server's current
    copy. The client merges it and resends. Nothing is overwritten blindly.
  - Records are independent: the writes that do match are kept.
  - A write that can never succeed as sent (for example, a task with no valid date)
    comes back as `rejected` with `error.invalidRecord`.
- **Reads** (`GET /pm-tracker/records[?since=N]`) return a full snapshot, or only the
  records and tombstones with a revision above `N`, plus the new cursor. All the
  reads run in one `REPEATABLE READ` transaction.
- **Ordering.** All writes for one user run under
  `pg_advisory_xact_lock(hashtext('pm_tracker:' || user_id))`. Revisions therefore
  commit in order per user, and a reader that moves its cursor to the highest revision
  it saw can never miss a lower one that commits later.
- **Migration from the blob.** This is lazy and runs per user, on their first records
  request (`MigrateStateToRecordsHandler`).
  - It runs in one transaction under the user's lock.
  - Every top-level key except `tasks` and `_v` becomes a section record, copied
    as-is. A key the blob does not have gets no record.
  - Every task with an id and a `YYYY-MM-DD` date becomes a row. The mapping is
    lossless: fields without a column go in `rest`, and a value a column would coerce
    is kept there under its own name.
  - The copied row count is checked before commit. On any mismatch, the transaction
    rolls back and the user stays on the blob.
  - The blob row is not modified beyond `migrated_at`. It stays as the backup.
- **Old clients**
  - After migration, `PUT /state` answers 409 `error.pmTrackerStateMigrated`. The
    update is also guarded by `migrated_at IS NULL`, so a save racing the migration
    loses.
  - `GET /state` answers with the records assembled into the old shape.
  - The blob-derived mirror refresh takes the same lock and stops once the user is
    migrated.

### Why not store each Jira issue once?

Tasks are per-day snapshots: each day's copy of an issue records that day's status,
PRs and comment, and Reports and carry-over read them. Keeping one copy per issue would
erase that history. Storage and bandwidth were never the real cost: saves now send only
the records that changed, and responses are gzip-compressed, which collapses the
repeated issue text.

## Consequences

- Positive
  - A stale tab or device can no longer overwrite newer data.
  - A save's size is the size of the change, not of the whole state.
  - Other tabs can pull changes cheaply with `since`.
  - Server-side sync becomes possible, because the server can write records safely
    alongside clients.
- Negative
  - The client must keep each record's base revision and merge conflicts.
  - Reverting the migration (`down`) sends every user back to their blob as it was
    when they were migrated. Anything changed afterwards lives only in the dropped
    tables, so back those up before reverting.
