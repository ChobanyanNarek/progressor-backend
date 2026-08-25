import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { PageDto } from '../../../../common/dto/page.dto.ts';
import { ReleaseNoteTaskDto } from '../../dtos/release-note-task.dto.ts';
import type { ReleaseNoteTasksPageOptionsDto } from '../../dtos/release-note-tasks-page-options.dto.ts';
import { ReleaseNoteTasksHandler } from './release-note-tasks.handler.ts';
import { ReleaseNoteTasksQuery } from './release-note-tasks.query.ts';

const USER_ID = '11111111-1111-4111-8111-111111111111' as Uuid;
const TASK_ID = '22222222-2222-4222-8222-222222222222' as Uuid;

function makeTaskEntity(
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> {
  return {
    id: TASK_ID,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    clientId: 'task-1',
    devId: 'dev-1',
    projectId: 'proj-1',
    title: 'Fix checkout bug',
    status: 'done',
    date: '2026-01-15',
    comment: null,
    jiras: [],
    rest: {},
    ...overrides,
  };
}

describe('ReleaseNoteTasksHandler', () => {
  let handler: ReleaseNoteTasksHandler;
  let where: jest.Mock;
  let andWhere: jest.Mock;
  let paginate: jest.Mock<() => Promise<unknown>>;

  function makeHandler(rows: unknown[]): void {
    const qb: Record<string, unknown> = {};
    where = jest.fn().mockReturnValue(qb);
    qb.where = where;
    andWhere = jest.fn().mockReturnValue(qb);
    qb.andWhere = andWhere;
    qb.orderBy = jest.fn().mockReturnValue(qb);
    qb.addOrderBy = jest.fn().mockReturnValue(qb);
    paginate = jest
      .fn<() => Promise<unknown>>()
      .mockResolvedValue([rows, { itemCount: rows.length }]);
    qb.paginate = paginate;

    handler = new ReleaseNoteTasksHandler({
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    } as never);
  }

  describe('when tasks exist in range', () => {
    beforeEach(() => {
      makeHandler([makeTaskEntity()]);
    });

    it('returns a PageDto of ReleaseNoteTaskDto instances', async () => {
      const opts = {
        order: 'ASC',
        page: 1,
        take: 25,
      } as unknown as ReleaseNoteTasksPageOptionsDto;

      const result = await handler.execute(
        new ReleaseNoteTasksQuery(USER_ID, opts),
      );

      expect(result).toBeInstanceOf(PageDto);
      expect(result.data[0]).toBeInstanceOf(ReleaseNoteTaskDto);
    });

    it('scopes the query to the requesting user', async () => {
      const opts = {
        order: 'ASC',
        page: 1,
        take: 25,
      } as unknown as ReleaseNoteTasksPageOptionsDto;

      await handler.execute(new ReleaseNoteTasksQuery(USER_ID, opts));

      expect(where).toHaveBeenCalledWith('t.user_id = :userId', {
        userId: USER_ID,
      });
    });

    it('applies dateFrom/dateTo/projectId filters when provided', async () => {
      const opts = {
        projectId: 'proj-1',
        dateFrom: '2026-01-01',
        dateTo: '2026-01-31',
        order: 'ASC',
        page: 1,
        take: 25,
      } as unknown as ReleaseNoteTasksPageOptionsDto;

      await handler.execute(new ReleaseNoteTasksQuery(USER_ID, opts));

      expect(andWhere).toHaveBeenCalledWith('t.project_id = :projectId', {
        projectId: 'proj-1',
      });
      expect(andWhere).toHaveBeenCalledWith('t.date >= :dateFrom', {
        dateFrom: '2026-01-01',
      });
      expect(andWhere).toHaveBeenCalledWith('t.date <= :dateTo', {
        dateTo: '2026-01-31',
      });
    });
  });

  describe('when no tasks are in range', () => {
    beforeEach(() => {
      makeHandler([]);
    });

    it('returns an empty PageDto', async () => {
      const opts = {
        dateFrom: '2099-01-01',
        order: 'ASC',
        page: 1,
        take: 25,
      } as unknown as ReleaseNoteTasksPageOptionsDto;

      const result = await handler.execute(
        new ReleaseNoteTasksQuery(USER_ID, opts),
      );

      expect(result).toBeInstanceOf(PageDto);
      expect(result.data).toHaveLength(0);
    });
  });
});
