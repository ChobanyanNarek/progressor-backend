import type { EntityManager } from 'typeorm';

/*
 * Shared rules for per-record storage (ADR-0018). A user's data is a set of records:
 * one row per task in pm_tracker_task, and one row per top-level settings section
 * (developers, projects, jiraConnections, ...) in pm_tracker_doc. Every write stamps the
 * record with the next value of one global sequence, so a revision is both the record's
 * version (writes must name the revision they started from) and a cursor for
 * "what changed since".
 */

export const REVISION_SEQUENCE = 'pm_tracker_revision_seq';

// Section names come from the client; keep them to plain identifiers.
export const DOC_KEY_PATTERN = /^[A-Za-z]\w{0,63}$/;

// The blob keys that are not settings sections: tasks get their own rows, _v is a format tag.
const NON_DOC_KEYS = new Set(['tasks', '_v']);

export function isDocKey(key: string): boolean {
  return DOC_KEY_PATTERN.test(key) && !NON_DOC_KEYS.has(key);
}

export interface ITaskRow {
  clientId: string;
  devId: string;
  projectId: string;
  title: string;
  status: string;
  date: string;
  comment: string | null;
  jiras: unknown[];
  rest: Record<string, unknown>;
}

// A stored task as SELECTed with TASK_COLUMNS.
export interface IStoredTaskRow extends ITaskRow {
  revision: string;
}

export const TASK_COLUMNS = `client_id AS "clientId", dev_id AS "devId", project_id AS "projectId", title, status,
  to_char(date, 'YYYY-MM-DD') AS date, comment, jiras, rest, revision`;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const isString = (v: unknown): v is string => typeof v === 'string';
const isArray = (v: unknown): v is unknown[] => Array.isArray(v);

/*
 * A task as the client holds it -> the row's columns. The named columns serve Search and
 * Release Notes; every other field rides along in `rest`, so rowToTask() gives back
 * exactly what came in. Null when the task cannot be stored (no id, or no usable date).
 */
export function taskToRow(task: Record<string, unknown>): ITaskRow | null {
  const { id, date, devId, projectId, title, status, comment, jiras, ...rest } =
    task;

  if (typeof id !== 'string' || id === '' || id.length > 200) {
    return null;
  }

  if (typeof date !== 'string' || !DATE_PATTERN.test(date)) {
    return null;
  }

  /*
   * Keep a value the columns would coerce (a non-string title, say) in `rest` under its
   * own name, so the round trip stays exact rather than "close enough".
   */
  const column = <T>(
    name: string,
    value: unknown,
    ok: (v: unknown) => v is T,
    fallback: T,
  ): T => {
    if (ok(value)) {
      return value;
    }

    if (value !== undefined) {
      rest[name] = value;
    }

    return fallback;
  };

  return {
    clientId: id,
    date,
    devId: column('devId', devId, isString, ''),
    projectId: column('projectId', projectId, isString, ''),
    title: column('title', title, isString, ''),
    status: column('status', status, isString, ''),
    comment: column('comment', comment, isString, null as string | null),
    jiras: column('jiras', jiras, isArray, []),
    rest,
  };
}

export function rowToTask(row: ITaskRow): Record<string, unknown> {
  const task: Record<string, unknown> = {
    id: row.clientId,
    date: row.date,
    devId: row.devId,
    projectId: row.projectId,
    title: row.title,
    status: row.status,
    jiras: row.jiras,
  };

  if (row.comment !== null) {
    task.comment = row.comment;
  }

  // A field kept aside by taskToRow wins over the column's stand-in value.
  return Object.assign(task, row.rest);
}

/*
 * Serialise every write for one user. Revisions come from a global sequence, and a
 * reader moves its cursor to the highest revision it saw -- which is only safe if no
 * transaction holding a lower revision can still commit after that. Taking this lock
 * around each user's writes guarantees it, and also keeps two tabs' commits from
 * interleaving.
 */
export async function lockUser(
  manager: EntityManager,
  userId: Uuid,
): Promise<void> {
  await manager.query(
    `SELECT pg_advisory_xact_lock(hashtext('pm_tracker:' || $1))`,
    [userId],
  );
}

/*
 * Raw query returning rows. TypeORM's Postgres runner hands back [rows, rowCount] for
 * UPDATE and DELETE (even with RETURNING) and plain rows for everything else; this
 * always gives the rows.
 */
export async function queryRows<T>(
  manager: EntityManager,
  sql: string,
  params: unknown[],
): Promise<T[]> {
  const result: unknown = await manager.query(sql, params);

  if (
    Array.isArray(result) &&
    result.length === 2 &&
    Array.isArray(result[0]) &&
    typeof result[1] === 'number'
  ) {
    return result[0] as T[];
  }

  return result as T[];
}
