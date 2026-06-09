import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { PageDto } from '../../../../common/dto/page.dto.ts';
import { MemoryPointStatus } from '../../../../constants/memory-point-status.ts';
import { SearchMemoryPointDto } from '../../dtos/search-memory-point.dto.ts';
import type { SearchMemoryPointsPageOptionsDto } from '../../dtos/search-memory-points-page-options.dto.ts';
import { SearchMemoryPointsHandler } from './search-memory-points.handler.ts';
import { SearchMemoryPointsQuery } from './search-memory-points.query.ts';

const POINT_ID = '11111111-1111-4111-8111-111111111111' as Uuid;

function makePoint(
  status: MemoryPointStatus,
  title: string,
): Record<string, unknown> {
  return {
    id: POINT_ID,
    location: { type: 'Point', coordinates: [44.5152, 40.1872] },
    status,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    memoryPointDetails: { title, description: null },
  };
}

describe('SearchMemoryPointsHandler', () => {
  let handler: SearchMemoryPointsHandler;
  let andWhere: jest.Mock;
  let paginate: jest.Mock<() => Promise<unknown>>;

  function makeHandler(rows: unknown[]): void {
    const qb: Record<string, unknown> = {};
    qb.leftJoinAndSelect = jest.fn().mockReturnValue(qb);
    qb.where = jest.fn().mockReturnValue(qb);
    andWhere = jest.fn().mockReturnValue(qb);
    qb.andWhere = andWhere;
    qb.orderBy = jest.fn().mockReturnValue(qb);
    qb.addOrderBy = jest.fn().mockReturnValue(qb);
    paginate = jest
      .fn<() => Promise<unknown>>()
      .mockResolvedValue([rows, { itemCount: rows.length }]);
    qb.paginate = paginate;

    handler = new SearchMemoryPointsHandler({
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    } as never);
  }

  describe('when matches exist', () => {
    const approvedPoint = makePoint(MemoryPointStatus.APPROVED, 'Grandma Rose');

    beforeEach(() => {
      makeHandler([approvedPoint]);
    });

    it('returns a PageDto of SearchMemoryPointDto instances', async () => {
      const opts = {
        q: 'grandma',
        order: 'ASC',
        page: 1,
        take: 10,
      } as unknown as SearchMemoryPointsPageOptionsDto;

      const result = await handler.execute(new SearchMemoryPointsQuery(opts));

      expect(result).toBeInstanceOf(PageDto);
      expect(result.data[0]).toBeInstanceOf(SearchMemoryPointDto);
    });

    it('applies an escaped ILIKE filter with wildcard-wrapped query term', async () => {
      const opts = {
        q: 'grandma',
        order: 'ASC',
        page: 1,
        take: 10,
      } as unknown as SearchMemoryPointsPageOptionsDto;

      await handler.execute(new SearchMemoryPointsQuery(opts));

      expect(andWhere).toHaveBeenCalledWith(
        String.raw`details.title ILIKE :q ESCAPE '\'`,
        {
          q: '%grandma%',
        },
      );
    });

    it('escapes LIKE metacharacters in the search term', async () => {
      const opts = {
        q: '50%_x',
        order: 'ASC',
        page: 1,
        take: 10,
      } as unknown as SearchMemoryPointsPageOptionsDto;

      await handler.execute(new SearchMemoryPointsQuery(opts));

      // % and _ are backslash-escaped so they match literally, not as wildcards.
      expect(andWhere).toHaveBeenCalledWith(
        String.raw`details.title ILIKE :q ESCAPE '\'`,
        {
          q: String.raw`%50\%\_x%`,
        },
      );
    });
  });

  describe('when no matches exist', () => {
    beforeEach(() => {
      makeHandler([]);
    });

    it('returns an empty PageDto', async () => {
      const opts = {
        q: 'zzz',
        order: 'ASC',
        page: 1,
        take: 10,
      } as unknown as SearchMemoryPointsPageOptionsDto;

      const result = await handler.execute(new SearchMemoryPointsQuery(opts));

      expect(result).toBeInstanceOf(PageDto);
      expect(result.data).toHaveLength(0);
    });
  });

  describe('visibility guard', () => {
    const approvedPoint = makePoint(
      MemoryPointStatus.APPROVED,
      'Only Approved',
    );

    beforeEach(() => {
      // Simulate DB already filtering to APPROVED (the query sets .where status = APPROVED)
      makeHandler([approvedPoint]);
    });

    it('passes APPROVED status filter to the query builder', async () => {
      const qb: Record<string, unknown> = {};
      const where = jest.fn().mockReturnValue(qb);
      qb.leftJoinAndSelect = jest.fn().mockReturnValue(qb);
      qb.where = where;
      qb.andWhere = jest.fn().mockReturnValue(qb);
      qb.orderBy = jest.fn().mockReturnValue(qb);
      qb.addOrderBy = jest.fn().mockReturnValue(qb);
      qb.paginate = jest
        .fn<() => Promise<unknown>>()
        .mockResolvedValue([[approvedPoint], { itemCount: 1 }]);

      const h = new SearchMemoryPointsHandler({
        createQueryBuilder: jest.fn().mockReturnValue(qb),
      } as never);

      await h.execute(
        new SearchMemoryPointsQuery({
          q: 'only',
          order: 'ASC',
          page: 1,
          take: 10,
        } as unknown as SearchMemoryPointsPageOptionsDto),
      );

      expect(where).toHaveBeenCalledWith('mp.status = :status', {
        status: MemoryPointStatus.APPROVED,
      });
    });
  });
});
