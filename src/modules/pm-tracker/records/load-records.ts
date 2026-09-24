import type { EntityManager } from 'typeorm';

import { queryRows, TASK_COLUMNS } from './record-mapping.ts';

/*
 * A user's records -- everything (since undefined) or only what changed after a revision
 * -- read in one REPEATABLE READ transaction, so the reads see one moment and the cursor
 * covers exactly what was returned (ADR-0018).
 *
 * `asText` returns the JSON columns as Postgres's own text instead of parsed objects, for
 * writing the HTTP response without parsing and re-serialising megabytes of task data.
 */

export interface IRecordRows<J> {
  isFull: boolean;
  cursor: number;
  docs: Array<{ key: string; data: J | null; revision: string }>;
  tasks: Array<{
    clientId: string;
    devId: string;
    projectId: string;
    title: string;
    status: string;
    date: string;
    comment: string | null;
    jiras: J;
    rest: J;
    revision: string;
  }>;
  deleted: Array<{ recordId: string; revision: string }>;
}

const TASK_TEXT_COLUMNS = `client_id AS "clientId", dev_id AS "devId", project_id AS "projectId", title, status,
  to_char(date, 'YYYY-MM-DD') AS date, comment, jiras::text AS jiras, rest::text AS rest, revision`;

export function loadRecordRows<J>(
  manager: EntityManager,
  userId: Uuid,
  since: number | undefined,
  asText: boolean,
): Promise<IRecordRows<J>> {
  const isFull = since === undefined;
  const after = since ?? -1;

  return manager.transaction('REPEATABLE READ', async (tx) => {
    // One connection runs these in turn; Promise.all only saves the round-trip waits.
    const [docs, tasks, deleted, top] = await Promise.all([
      queryRows<IRecordRows<J>['docs'][number]>(
        tx,
        `SELECT key, ${asText ? 'data::text AS data' : 'data'}, revision FROM pm_tracker_doc
         WHERE user_id = $1 AND revision > $2 ORDER BY key`,
        [userId, after],
      ),
      queryRows<IRecordRows<J>['tasks'][number]>(
        tx,
        `SELECT ${asText ? TASK_TEXT_COLUMNS : TASK_COLUMNS}
         FROM pm_tracker_task WHERE user_id = $1 AND revision > $2 ORDER BY date, created_at`,
        [userId, after],
      ),
      isFull
        ? Promise.resolve([])
        : queryRows<IRecordRows<J>['deleted'][number]>(
            tx,
            `SELECT record_id AS "recordId", revision FROM pm_tracker_tombstone WHERE user_id = $1 AND revision > $2`,
            [userId, after],
          ),
      /*
       * The cursor is the user's highest revision anywhere, not just among what was
       * returned: a full snapshot with no rows still needs a cursor to continue from.
       */
      queryRows<{ cursor: string | null }>(
        tx,
        `SELECT GREATEST(
           (SELECT max(revision) FROM pm_tracker_doc WHERE user_id = $1),
           (SELECT max(revision) FROM pm_tracker_task WHERE user_id = $1),
           (SELECT max(revision) FROM pm_tracker_tombstone WHERE user_id = $1)
         ) AS cursor`,
        [userId],
      ),
    ]);

    return {
      isFull,
      cursor: Math.max(Number(top[0]?.cursor ?? 0), isFull ? 0 : after),
      docs,
      tasks,
      deleted,
    };
  });
}

/*
 * The records response as JSON, assembled from Postgres's text for the JSON columns. A task
 * is its columns plus every field kept in `rest`, with `rest` winning -- written as `rest`'s
 * members after the columns, so JSON.parse's last-key-wins gives exactly rowToTask().
 */
export function recordsJson(rows: IRecordRows<string>): string {
  const docs = rows.docs.map(
    (d) =>
      `{"key":${JSON.stringify(d.key)},"data":${d.data ?? 'null'},"revision":${Number(d.revision)}}`,
  );
  const tasks = rows.tasks.map((t) => {
    const columns = JSON.stringify({
      id: t.clientId,
      date: t.date,
      devId: t.devId,
      projectId: t.projectId,
      title: t.title,
      status: t.status,
      ...(t.comment === null ? {} : { comment: t.comment }),
    }).slice(0, -1);
    const rest = t.rest.trim();
    const restMembers = rest === '{}' ? '' : `,${rest.slice(1, -1)}`;

    return `{"id":${JSON.stringify(t.clientId)},"data":${columns},"jiras":${t.jiras}${restMembers}},"revision":${Number(t.revision)}}`;
  });
  const deleted = rows.deleted.map(
    (d) =>
      `{"id":${JSON.stringify(d.recordId)},"revision":${Number(d.revision)}}`,
  );

  return `{"full":${rows.isFull},"cursor":${rows.cursor},"docs":[${docs.join(',')}],"tasks":[${tasks.join(',')}],"deleted":[${deleted.join(',')}]}`;
}
