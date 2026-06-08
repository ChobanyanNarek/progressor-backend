import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { MemoryPointStatus } from '../../../../constants/memory-point-status.ts';
import { GetMemoryPointStatsHandler } from './get-memory-point-stats.handler.ts';

describe('GetMemoryPointStatsHandler', () => {
  let handler: GetMemoryPointStatsHandler;
  let getRawMany: jest.Mock<() => Promise<unknown>>;

  beforeEach(() => {
    const qb: Record<string, unknown> = {};
    qb.select = jest.fn().mockReturnValue(qb);
    qb.addSelect = jest.fn().mockReturnValue(qb);
    qb.groupBy = jest.fn().mockReturnValue(qb);
    getRawMany = jest.fn<() => Promise<unknown>>().mockResolvedValue([
      { status: MemoryPointStatus.PENDING, count: '4' },
      { status: MemoryPointStatus.APPROVED, count: '6' },
    ]);
    qb.getRawMany = getRawMany;

    handler = new GetMemoryPointStatsHandler({
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    } as never);
  });

  it('aggregates counts per status and totals them', async () => {
    const result = await handler.execute();

    expect(result.total).toBe(10);
    expect(result.byStatus.pending).toBe(4);
    expect(result.byStatus.approved).toBe(6);
    // Statuses with no rows are still present as zero.
    expect(result.byStatus.rejected).toBe(0);
  });

  it('returns every status zeroed when no points exist', async () => {
    getRawMany.mockResolvedValue([]);

    const result = await handler.execute();

    expect(result.total).toBe(0);
    expect(Object.values(result.byStatus).every((c) => c === 0)).toBe(true);
    expect(Object.keys(result.byStatus)).toHaveLength(
      Object.values(MemoryPointStatus).length,
    );
  });
});
