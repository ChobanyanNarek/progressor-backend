import type { Repository } from 'typeorm';
import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity.js';

import { PmTrackerTaskEntity } from '../../entities/pm-tracker-task.entity.ts';
import { lockUser, queryRows } from '../../records/record-mapping.ts';

interface IFrontendTask {
  id?: unknown;
  devId?: unknown;
  projectId?: unknown;
  title?: unknown;
  status?: unknown;
  date?: unknown;
  comment?: unknown;
  jiras?: unknown;
  [key: string]: unknown;
}

type TaskRow = QueryDeepPartialEntity<PmTrackerTaskEntity>;

/*
 * Maps one frontend task into a task-table row, or null for malformed
 * entries (missing id/date) — the blob isn't schema-validated on the way in,
 * so a bad entry is skipped rather than failing the whole sync.
 */
function toTaskRow(userId: Uuid, raw: IFrontendTask): TaskRow | null {
  const clientId = typeof raw.id === 'string' ? raw.id : null;
  const date = typeof raw.date === 'string' ? raw.date : null;

  if (!clientId || !date) {
    return null;
  }

  const { devId, projectId, title, status, comment, jiras, ...rest } = raw;
  delete rest.id;
  delete rest.date;

  return {
    userId,
    clientId,
    devId: typeof devId === 'string' ? devId : '',
    projectId: typeof projectId === 'string' ? projectId : '',
    title: typeof title === 'string' ? title : '',
    status: typeof status === 'string' ? status : 'todo',
    date,
    comment: typeof comment === 'string' ? comment : null,
    jiras: (Array.isArray(jiras) ? jiras : []) as never,
    rest: rest as never,
  };
}

/**
 * Dual-write helper: mirrors `data.tasks` from a pm_tracker_state save into
 * the pm_tracker_task table, so Search/Release-Notes can query it without the
 * frontend's save path changing. Called from SavePmTrackerStateHandler
 * whenever the saved blob includes a `tasks` array.
 *
 * Upserts every task by (userId, clientId), then deletes any existing rows
 * for this user whose clientId is no longer present in the blob — keeps the
 * mirror table exactly in sync with what the frontend considers "current"
 * (carried-over/duplicated/deleted tasks all resolve correctly this way,
 * since the blob is always the frontend's full, authoritative task list).
 */
/*
 * Postgres caps a single statement at 65535 bind parameters. A task row binds about ten, so
 * writing every task in one upsert failed outright past ~6500 tasks, and the NOT IN list for
 * stale rows had the same ceiling. Both are now done in bounded chunks.
 */
const UPSERT_CHUNK = 500;
const DELETE_CHUNK = 1000;

async function mirrorTasks(
  taskRepository: Repository<PmTrackerTaskEntity>,
  userId: Uuid,
  data: Record<string, unknown>,
): Promise<void> {
  const rawTasks = data.tasks as IFrontendTask[];

  const rows = rawTasks
    .map((raw) => toTaskRow(userId, raw))
    .filter((row): row is TaskRow => row !== null);

  for (let i = 0; i < rows.length; i += UPSERT_CHUNK) {
    // eslint-disable-next-line no-await-in-loop -- sequential by design: bounds memory and parameter count
    await taskRepository.upsert(rows.slice(i, i + UPSERT_CHUNK), [
      'userId',
      'clientId',
    ]);
  }

  /*
   * Work out stale rows in memory from the ids alone, rather than a NOT IN over every
   * current id: that keeps the statement size independent of how many tasks the user has.
   */
  const current = new Set(rows.map((row) => row.clientId as string));
  const existing = await taskRepository
    .createQueryBuilder('t')
    .select('t.client_id', 'clientId')
    .where('t.user_id = :userId', { userId })
    .getRawMany<{ clientId: string }>();
  const stale = existing
    .map((row) => row.clientId)
    .filter((clientId) => !current.has(clientId));

  for (let i = 0; i < stale.length; i += DELETE_CHUNK) {
    // eslint-disable-next-line no-await-in-loop -- sequential by design: bounds parameter count
    await taskRepository
      .createQueryBuilder()
      .delete()
      .where('user_id = :userId', { userId })
      .andWhere('client_id IN (:...ids)', {
        ids: stale.slice(i, i + DELETE_CHUNK),
      })
      .execute();
  }
}

export async function syncTasksFromState(
  taskRepository: Repository<PmTrackerTaskEntity>,
  userId: Uuid,
  data: Record<string, unknown>,
): Promise<void> {
  if (!Array.isArray(data.tasks)) {
    return;
  }

  /*
   * Under the user's lock, and only while the user is still on the blob: once migrated,
   * pm_tracker_task holds the real records and this blob-derived copy must not touch
   * them. A mirror refresh still running from a save made just before the migration
   * either finishes first (and the migration then rebuilds from the blob) or sees the
   * migration and stops.
   */
  await taskRepository.manager.transaction(async (manager) => {
    await lockUser(manager, userId);

    const migrated = await queryRows<{ id: string }>(
      manager,
      `SELECT id FROM pm_tracker_state WHERE user_id = $1 AND migrated_at IS NOT NULL`,
      [userId],
    );

    if (migrated.length > 0) {
      return;
    }

    await mirrorTasks(manager.getRepository(PmTrackerTaskEntity), userId, data);
  });
}
