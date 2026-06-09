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
  paginate: jest.Mock;
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
  let qb: IQbDouble;
  let createQueryBuilder: jest.Mock;

  beforeEach(() => {
    qb = {} as IQbDouble;
    qb.andWhere = jest.fn().mockReturnValue(qb);
    qb.orderBy = jest.fn().mockReturnValue(qb);
    qb.paginate = jest
      .fn<() => Promise<unknown>>()
      .mockResolvedValue([[logRow], pageMeta]);

    createQueryBuilder = jest.fn().mockReturnValue(qb);

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

    expect(qb.orderBy).toHaveBeenCalledWith('log.timestamp', Order.ASC);
  });

  it('paginates with the options dto', async () => {
    await run({});

    expect(qb.paginate).toHaveBeenCalledTimes(1);
  });

  it('carries the page itemCount on the meta', async () => {
    const result = await run({});

    expect(result.meta.itemCount).toBe(1);
  });

  it('applies the level filter', async () => {
    await run({ level: LogLevel.WARN });

    expect(qb.andWhere).toHaveBeenCalledWith('log.level = :level', {
      level: LogLevel.WARN,
    });
  });

  it('applies the source filter', async () => {
    await run({ source: LogSource.AUTH });

    expect(qb.andWhere).toHaveBeenCalledWith('log.source = :source', {
      source: LogSource.AUTH,
    });
  });

  it('applies the from/to time window', async () => {
    const from = new Date('2026-01-01T00:00:00.000Z');
    const to = new Date('2026-01-31T23:59:59.000Z');

    await run({ from, to });

    expect(qb.andWhere).toHaveBeenCalledWith('log.timestamp >= :from', {
      from,
    });
    expect(qb.andWhere).toHaveBeenCalledWith('log.timestamp <= :to', { to });
  });

  it('applies the memoryPointId filter', async () => {
    const memoryPointId = '22222222-2222-4222-8222-222222222222' as Uuid;

    await run({ memoryPointId });

    expect(qb.andWhere).toHaveBeenCalledWith(
      'log.memoryPointId = :memoryPointId',
      { memoryPointId },
    );
  });

  it('applies a case-insensitive ILIKE message filter when q is present', async () => {
    await run({ q: 'render' });

    expect(qb.andWhere).toHaveBeenCalledWith('log.message ILIKE :q', {
      q: '%render%',
    });
  });

  it('skips all optional filters when none are provided', async () => {
    await run({});

    expect(qb.andWhere).not.toHaveBeenCalled();
  });
});
