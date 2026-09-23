import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { syncTasksFromState } from './sync-tasks-from-state.ts';

const USER_ID = '11111111-1111-4111-8111-111111111111' as Uuid;

describe('syncTasksFromState', () => {
  let upsert: jest.Mock<() => Promise<number>>;
  let execute: jest.Mock<() => Promise<number>>;
  let andWhere: jest.Mock;
  let existingIds: string[];
  let repo: Record<string, unknown>;

  beforeEach(() => {
    upsert = jest.fn<() => Promise<number>>().mockResolvedValue(1);
    execute = jest.fn<() => Promise<number>>().mockResolvedValue(1);
    existingIds = [];

    // One builder serves both the id lookup and the chunked deletes.
    const qb: Record<string, unknown> = {};
    qb.select = jest.fn().mockReturnValue(qb);
    qb.delete = jest.fn().mockReturnValue(qb);
    qb.where = jest.fn().mockReturnValue(qb);
    andWhere = jest.fn().mockReturnValue(qb);
    qb.andWhere = andWhere;
    qb.execute = execute;
    qb.getRawMany = jest.fn(() =>
      Promise.resolve(existingIds.map((clientId) => ({ clientId }))),
    );

    repo = {
      upsert,
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    };
  });

  it('does nothing when data.tasks is not an array', async () => {
    await syncTasksFromState(repo as never, USER_ID, { tasks: 'not-array' });

    expect(upsert).not.toHaveBeenCalled();
  });

  it('upserts well-formed tasks keyed on (userId, clientId)', async () => {
    await syncTasksFromState(repo as never, USER_ID, {
      tasks: [
        {
          id: 'task-1',
          devId: 'dev-1',
          projectId: 'proj-1',
          title: 'Fix bug',
          status: 'inprogress',
          date: '2026-01-15',
          comment: 'in review',
          jiras: [{ url: 'https://x/JIRA-1', name: 'Issue' }],
          prs: [],
          carriedOver: true,
        },
      ],
    });

    expect(upsert).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          userId: USER_ID,
          clientId: 'task-1',
          devId: 'dev-1',
          projectId: 'proj-1',
          title: 'Fix bug',
          status: 'inprogress',
          date: '2026-01-15',
          comment: 'in review',
          jiras: [{ url: 'https://x/JIRA-1', name: 'Issue' }],
          rest: { prs: [], carriedOver: true },
        }),
      ],
      ['userId', 'clientId'],
    );
  });

  it('skips malformed entries missing id or date', async () => {
    await syncTasksFromState(repo as never, USER_ID, {
      tasks: [
        { devId: 'dev-1', date: '2026-01-15' }, // missing id
        { id: 'task-2', devId: 'dev-1' }, // missing date
        { id: 'task-3', devId: 'dev-1', date: '2026-01-16' }, // valid
      ],
    });

    expect(upsert).toHaveBeenCalledWith(
      [expect.objectContaining({ clientId: 'task-3' })],
      ['userId', 'clientId'],
    );
  });

  it('deletes only rows whose clientId is no longer present', async () => {
    existingIds = ['task-1', 'gone-1', 'gone-2'];

    await syncTasksFromState(repo as never, USER_ID, {
      tasks: [{ id: 'task-1', devId: 'dev-1', date: '2026-01-15' }],
    });

    expect(andWhere).toHaveBeenCalledWith('client_id IN (:...ids)', {
      ids: ['gone-1', 'gone-2'],
    });
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('deletes nothing when every stored row is still present', async () => {
    existingIds = ['task-1'];

    await syncTasksFromState(repo as never, USER_ID, {
      tasks: [{ id: 'task-1', devId: 'dev-1', date: '2026-01-15' }],
    });

    expect(execute).not.toHaveBeenCalled();
  });

  it("deletes all of the user's rows when the blob has zero valid tasks", async () => {
    existingIds = ['old-1', 'old-2'];

    await syncTasksFromState(repo as never, USER_ID, { tasks: [] });

    expect(upsert).not.toHaveBeenCalled();
    expect(andWhere).toHaveBeenCalledWith('client_id IN (:...ids)', {
      ids: ['old-1', 'old-2'],
    });
  });

  it('writes large task lists in bounded chunks', async () => {
    /*
     * Postgres rejects a statement with more than 65535 bind parameters. A single upsert
     * of every task hit that past ~6500 tasks, failing the whole mirror sync.
     */
    const tasks = Array.from({ length: 1201 }, (_, i) => ({
      id: `task-${i}`,
      devId: 'dev-1',
      date: '2026-01-15',
    }));

    await syncTasksFromState(repo as never, USER_ID, { tasks });

    expect(upsert).toHaveBeenCalledTimes(3);

    for (const call of upsert.mock.calls) {
      expect(((call as unknown[])[0] as unknown[]).length).toBeLessThanOrEqual(
        500,
      );
    }
  });
});
