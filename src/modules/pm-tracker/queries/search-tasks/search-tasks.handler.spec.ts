import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { PageDto } from '../../../../common/dto/page.dto.ts';
import { PmTrackerTaskDto } from '../../dtos/pm-tracker-task.dto.ts';
import type { SearchTasksPageOptionsDto } from '../../dtos/search-tasks-page-options.dto.ts';
import { SearchTasksHandler } from './search-tasks.handler.ts';
import { SearchTasksQuery } from './search-tasks.query.ts';

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
    status: 'inprogress',
    date: '2026-01-15',
    comment: null,
    jiras: [],
    rest: {},
    toDto() {
      return new PmTrackerTaskDto(this as never);
    },
    ...overrides,
  };
}

describe('SearchTasksHandler', () => {
  let handler: SearchTasksHandler;
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

    handler = new SearchTasksHandler({
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    } as never);
  }

  describe('when matches exist', () => {
    beforeEach(() => {
      makeHandler([makeTaskEntity()]);
    });

    it('returns a PageDto of PmTrackerTaskDto instances', async () => {
      const opts = {
        q: 'checkout',
        order: 'ASC',
        page: 1,
        take: 25,
      } as unknown as SearchTasksPageOptionsDto;

      const result = await handler.execute(new SearchTasksQuery(USER_ID, opts));

      expect(result).toBeInstanceOf(PageDto);
      expect(result.data[0]).toBeInstanceOf(PmTrackerTaskDto);
    });

    it('scopes the query to the requesting user', async () => {
      const opts = {
        order: 'ASC',
        page: 1,
        take: 25,
      } as unknown as SearchTasksPageOptionsDto;

      await handler.execute(new SearchTasksQuery(USER_ID, opts));

      expect(where).toHaveBeenCalledWith('t.user_id = :userId', {
        userId: USER_ID,
      });
    });

    it('escapes LIKE metacharacters and matches title/comment/jiras via ILIKE', async () => {
      const opts = {
        q: '50%_x',
        order: 'ASC',
        page: 1,
        take: 25,
      } as unknown as SearchTasksPageOptionsDto;

      await handler.execute(new SearchTasksQuery(USER_ID, opts));

      const call = andWhere.mock.calls.find(
        (c) =>
          typeof c[0] === 'string' && c[0].includes('jsonb_array_elements'),
      );

      expect(call).toBeDefined();
      expect(call?.[1]).toEqual({ q: String.raw`%50\%\_x%` });
    });

    it('applies projectId and status filters when provided', async () => {
      const opts = {
        projectId: 'proj-1',
        status: 'done',
        order: 'ASC',
        page: 1,
        take: 25,
      } as unknown as SearchTasksPageOptionsDto;

      await handler.execute(new SearchTasksQuery(USER_ID, opts));

      expect(andWhere).toHaveBeenCalledWith('t.project_id = :projectId', {
        projectId: 'proj-1',
      });
      expect(andWhere).toHaveBeenCalledWith('t.status = :status', {
        status: 'done',
      });
    });
  });

  describe('when no matches exist', () => {
    beforeEach(() => {
      makeHandler([]);
    });

    it('returns an empty PageDto', async () => {
      const opts = {
        q: 'nothing-matches',
        order: 'ASC',
        page: 1,
        take: 25,
      } as unknown as SearchTasksPageOptionsDto;

      const result = await handler.execute(new SearchTasksQuery(USER_ID, opts));

      expect(result).toBeInstanceOf(PageDto);
      expect(result.data).toHaveLength(0);
    });
  });
});
