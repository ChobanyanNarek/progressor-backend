# ADR-0019: pm-tracker syncs run on the server, with the web app's own sync code

- **Status**: Accepted
- **Date**: 2026-09-23
- **Deciders**: Backend team

## Context and Problem Statement

The Jira, GitLab and GitHub syncs ran only in the browser, on timers, while the app was
open. Data was only as fresh as the last open tab, every tab and device repeated the work,
and nothing synced overnight or at weekends. The sync logic is subtle — project isolation,
prune-only-with-proof, status mapping, PR linking — and it took many production fixes to
get right. A second implementation on the server would drift from the first.

## Decision Outcome

**The server runs the same sync code as the browser.**

- The web app's sync logic lives in `pm-tracker/src/sync-core`: pure TypeScript with no DOM
  or storage access. It reaches the provider endpoints through a `Transport` and takes
  "today" and the timezone as inputs. Each sync is split into:
  - **compute** — the network work, done against a snapshot of the state
  - **apply** — folding the result into the state as it is when the work finishes
- `src/modules/pm-tracker/sync-core` here is a **generated copy**, written by that repo's
  `scripts/vendor-sync-core.mjs`. `--check` fails when the copy is stale. The copy is
  excluded from eslint and biome, but compiled with the backend's strict settings. The app
  also checks it with those settings (`tsconfig.sync-core.json`).
- `serverTransport` maps each provider route to the same `PmTrackerService` method its
  HTTP route calls, with the same `ValidationPipe` options. Credentials are resolved under
  the calling user only.
- `ServerSyncService` runs one user's sync:
  1. Load the user's records.
  2. Compute and apply each configured provider.
  3. Save through `CommitRecordsCommand` with a `RecordTracker`, like a browser tab
     (ADR-0018). A tab's edit made during the sync is merged, never overwritten.
  - One run per user at a time; concurrent requests join the run in progress.
- **Schedule.** Every minute, a sync runs for each user with a connection whose own
  `syncInterval` has passed since its `lastSync`, whether a browser or the server stamped
  that time. Users run one at a time, within a 45-second budget per tick.
  - Only users who may use the app are synced: an active account with a current
    subscription or trial, or `SUPER_ADMIN`.
  - A provider that fails backs off: 5 minutes, doubling up to 2 hours.
- **Timezone.** "Today" comes from the tracker's timezone. The server runs in UTC, which is
  the wrong day for four hours every night in Yerevan. So the web app saves its browser
  timezone as the `browserTimezone` section, and the server does not run scheduled syncs
  without it (or `trackerTimezone`). A manual sync sends the browser's zone.
- **Endpoints**
  - `POST /pm-tracker/sync` runs a sync now.
  - `GET /pm-tracker/sync` reports `serverSync: true`, the last run and the webhook path.
    The web app then leaves background syncs to the server and only pulls changes.
- **Webhooks.** `POST /pm-tracker/hooks/:token` is public and throttled. The random token
  (`pm_tracker_hook`) is the only credential. The payload is never read: a call only
  schedules a background sync for the token's owner, debounced 20 seconds.
- **Jira URL check.** Jira calls send the user's credentials to `baseUrl`, and the server
  now makes them automatically. The old substring check (`includes('atlassian.net')`) was
  replaced by `assertAtlassianUrl`: https, and a host ending in `.atlassian.net`.

## Consequences

- Positive
  - Data is fresh when the app opens.
  - One sync per interval for all tabs and devices.
  - Syncing continues while no one has the app open.
  - One implementation of the sync logic.
- Negative
  - Changing the sync means regenerating the copy here and deploying both sides.
  - Last-run status is kept in memory and resets on restart. Each connection's `lastSync`
    and `lastSyncResult` persist in its records.
