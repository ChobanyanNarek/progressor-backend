import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { PageDto } from '../../../../common/dto/page.dto.ts';
import { LogLevel } from '../../../../constants/log-level.ts';
import { LogSource } from '../../../../constants/log-source.ts';
import { Order } from '../../../../constants/order.ts';
import { AdminLogEntryEntity } from '../../admin-log-entry.entity.ts';
import { AdminLogEntryDto } from '../../dtos/admin-log-entry.dto.ts';
import type { AdminLogOptionsDto } from '../../dtos/admin-log-options.dto.ts';
import { GetAdminLogsHandler } from './get-admin-logs.handler.ts';
import { GetAdminLogsQuery } from './get-admin-logs.query.ts';

/** Minimal chainable query-builder double recording every call. */
interface IQbDouble {
  andWhere: jest.Mock;
  orderBy: jest.Mock;
  select: jest.Mock;
  addSelect: jest.Mock;
  groupBy: jest.Mock;
  paginate: jest.Mock;
  getRawMany: jest.Mock;
}

describe('GetAdminLogsHandler', () => {
  const pageMeta = { itemCount: 1 };

  // A real entity instance so `item.toDto()` runs the production mapping path.
  const logRow = Object.assign(new AdminLogEntryEntity(), {
    id: '11111111-1111-4111-8111-111111111111' as Uuid,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    timestamp: new Date('2026-01-03T10:00:00.000Z'),
    level: LogLevel.ERROR,
    source: LogSource.DID,
    message: 'd-id render failed',
    context: { jobId: 'abc' },
  });

  let handler: GetAdminLogsHandler;
  let listQb: IQbDouble;
  let countsQb: IQbDouble;
  let createQueryBuilder: jest.Mock;

  const makeQb = (): IQbDouble => {
    const qb = {} as IQbDouble;
    qb.andWhere = jest.fn().mockReturnValue(qb);
    qb.orderBy = jest.fn().mockReturnValue(qb);
    qb.select = jest.fn().mockReturnValue(qb);
    qb.addSelect = jest.fn().mockReturnValue(qb);
    qb.groupBy = jest.fn().mockReturnValue(qb);
    qb.paginate = jest
      .fn<() => Promise<unknown>>()
      .mockResolvedValue([[logRow], pageMeta]);
    qb.getRawMany = jest.fn<() => Promise<unknown>>().mockResolvedValue([
      { source: LogSource.API, count: '5' },
      { source: LogSource.DID, count: '2' },
    ]);

    return qb;
  };

  beforeEach(() => {
    listQb = makeQb();
    countsQb = makeQb();
    // First createQueryBuilder() call -> list query, second -> counts query.
    createQueryBuilder = jest
      .fn()
      .mockReturnValueOnce(listQb)
      .mockReturnValueOnce(countsQb);

    handler = new GetAdminLogsHandler({ createQueryBuilder } as never);
  });

  const run = (
    options: Partial<AdminLogOptionsDto>,
  ): Promise<PageDto<AdminLogEntryDto>> =>
    handler.execute(
      new GetAdminLogsQuery({
        order: Order.DESC,
        page: 1,
        take: 20,
        ...options,
      } as AdminLogOptionsDto),
    );

  it('returns a PageDto of AdminLogEntryDto with the mapped row', async () => {
    const result = await run({});

    expect(result).toBeInstanceOf(PageDto);
    expect(result.data[0]).toBeInstanceOf(AdminLogEntryDto);
    expect(result.data[0]!.message).toBe('d-id render failed');
    expect(result.data[0]!.source).toBe(LogSource.DID);
    expect(result.data[0]!.context).toEqual({ jobId: 'abc' });
  });

  it('orders by the timestamp column using the requested page order', async () => {
    await run({ order: Order.ASC });

    expect(listQb.orderBy).toHaveBeenCalledWith('log.timestamp', Order.ASC);
  });

  it('paginates the list query with the options dto', async () => {
    await run({});

    expect(listQb.paginate).toHaveBeenCalledTimes(1);
  });

  it('builds zero-filled per-source counts on meta.counts', async () => {
    const result = await run({});

    expect(
      (result.meta as unknown as { counts: Record<string, number> }).counts,
    ).toEqual({
      api: 5,
      ar: 0,
      did: 2,
      maps: 0,
      auth: 0,
    });
  });

  it('uses the page itemCount on the merged meta', async () => {
    const result = await run({});

    expect(result.meta.itemCount).toBe(1);
  });

  it('applies the level filter on both list and counts queries', async () => {
    await run({ level: LogLevel.WARN });

    expect(listQb.andWhere).toHaveBeenCalledWith('log.level = :level', {
      level: LogLevel.WARN,
    });
    expect(countsQb.andWhere).toHaveBeenCalledWith('log.level = :level', {
      level: LogLevel.WARN,
    });
  });

  it('applies the source filter on the list query only (counts stay cross-source)', async () => {
    await run({ source: LogSource.AUTH });

    expect(listQb.andWhere).toHaveBeenCalledWith('log.source = :source', {
      source: LogSource.AUTH,
    });
    expect(countsQb.andWhere).not.toHaveBeenCalledWith('log.source = :source', {
      source: LogSource.AUTH,
    });
  });

  it('applies the from/to time window on both queries', async () => {
    const from = new Date('2026-01-01T00:00:00.000Z');
    const to = new Date('2026-01-31T23:59:59.000Z');

    await run({ from, to });

    expect(listQb.andWhere).toHaveBeenCalledWith('log.timestamp >= :from', {
      from,
    });
    expect(listQb.andWhere).toHaveBeenCalledWith('log.timestamp <= :to', {
      to,
    });
    expect(countsQb.andWhere).toHaveBeenCalledWith('log.timestamp >= :from', {
      from,
    });
    expect(countsQb.andWhere).toHaveBeenCalledWith('log.timestamp <= :to', {
      to,
    });
  });

  it('applies the memoryPointId filter on both list and counts queries', async () => {
    const memoryPointId = '22222222-2222-4222-8222-222222222222' as Uuid;

    await run({ memoryPointId });

    expect(listQb.andWhere).toHaveBeenCalledWith(
      'log.memoryPointId = :memoryPointId',
      { memoryPointId },
    );
    expect(countsQb.andWhere).toHaveBeenCalledWith(
      'log.memoryPointId = :memoryPointId',
      { memoryPointId },
    );
  });

  it('applies a case-insensitive ILIKE message filter when q is present', async () => {
    await run({ q: 'render' });

    expect(listQb.andWhere).toHaveBeenCalledWith('log.message ILIKE :q', {
      q: '%render%',
    });
  });

  it('skips all optional filters when none are provided', async () => {
    await run({});

    expect(listQb.andWhere).not.toHaveBeenCalled();
    expect(countsQb.andWhere).not.toHaveBeenCalled();
  });
});
