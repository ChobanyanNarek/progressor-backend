import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { syncTasksFromState } from './sync-tasks-from-state.ts';

const USER_ID = '11111111-1111-4111-8111-111111111111' as Uuid;

describe('syncTasksFromState', () => {
  let upsert: jest.Mock<() => Promise<number>>;
  let execute: jest.Mock<() => Promise<number>>;
  let andWhere: jest.Mock;
  let repo: Record<string, unknown>;

  beforeEach(() => {
    upsert = jest.fn<() => Promise<number>>().mockResolvedValue(1);
    execute = jest.fn<() => Promise<number>>().mockResolvedValue(1);

    const deleteQb: Record<string, unknown> = {};
    deleteQb.delete = jest.fn().mockReturnValue(deleteQb);
    deleteQb.where = jest.fn().mockReturnValue(deleteQb);
    andWhere = jest.fn().mockReturnValue(deleteQb);
    deleteQb.andWhere = andWhere;
    deleteQb.execute = execute;

    repo = {
      upsert,
      createQueryBuilder: jest.fn().mockReturnValue(deleteQb),
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

  it('deletes rows for this user whose clientId is no longer present', async () => {
    await syncTasksFromState(repo as never, USER_ID, {
      tasks: [{ id: 'task-1', devId: 'dev-1', date: '2026-01-15' }],
    });

    expect(andWhere).toHaveBeenCalledWith(
      'client_id NOT IN (:...seenClientIds)',
      { seenClientIds: ['task-1'] },
    );
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it("deletes all of the user's rows when the blob has zero valid tasks", async () => {
    await syncTasksFromState(repo as never, USER_ID, { tasks: [] });

    expect(upsert).not.toHaveBeenCalled();
    expect(andWhere).not.toHaveBeenCalled();
    expect(execute).toHaveBeenCalledTimes(1);
  });
});
