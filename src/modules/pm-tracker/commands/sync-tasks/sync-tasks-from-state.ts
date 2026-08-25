import type { Repository } from 'typeorm';
import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity.js';

import type { PmTrackerTaskEntity } from '../../entities/pm-tracker-task.entity.ts';

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
export async function syncTasksFromState(
  taskRepository: Repository<PmTrackerTaskEntity>,
  userId: Uuid,
  data: Record<string, unknown>,
): Promise<void> {
  const rawTasks = data.tasks;

  if (!Array.isArray(rawTasks)) {
    return;
  }

  const rows = (rawTasks as IFrontendTask[])
    .map((raw) => toTaskRow(userId, raw))
    .filter((row): row is TaskRow => row !== null);

  if (rows.length > 0) {
    await taskRepository.upsert(rows, ['userId', 'clientId']);
  }

  const seenClientIds = rows.map((row) => row.clientId as string);

  const deleteQuery = taskRepository
    .createQueryBuilder()
    .delete()
    .where('user_id = :userId', { userId });

  await (
    seenClientIds.length > 0
      ? deleteQuery.andWhere('client_id NOT IN (:...seenClientIds)', {
          seenClientIds,
        })
      : deleteQuery
  ).execute();
}
