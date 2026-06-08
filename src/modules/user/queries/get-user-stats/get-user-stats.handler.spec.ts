import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { RoleType } from '../../../../constants/role-type.ts';
import { GetUserStatsHandler } from './get-user-stats.handler.ts';

describe('GetUserStatsHandler', () => {
  let handler: GetUserStatsHandler;
  let getRawMany: jest.Mock<() => Promise<unknown>>;

  beforeEach(() => {
    const qb: Record<string, unknown> = {};
    qb.select = jest.fn().mockReturnValue(qb);
    qb.addSelect = jest.fn().mockReturnValue(qb);
    qb.groupBy = jest.fn().mockReturnValue(qb);
    getRawMany = jest.fn<() => Promise<unknown>>().mockResolvedValue([
      { role: RoleType.CREATOR, count: '7' },
      { role: RoleType.ADMIN, count: '3' },
    ]);
    qb.getRawMany = getRawMany;

    handler = new GetUserStatsHandler({
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    } as never);
  });

  it('aggregates counts per role and totals them', async () => {
    const result = await handler.execute();

    expect(result.total).toBe(10);
    expect(result.byRole.creator).toBe(7);
    expect(result.byRole.admin).toBe(3);
  });

  it('returns zeroed roles when no users exist', async () => {
    getRawMany.mockResolvedValue([]);

    const result = await handler.execute();

    expect(result.total).toBe(0);
    expect(result.byRole.creator).toBe(0);
    expect(result.byRole.admin).toBe(0);
  });
});
