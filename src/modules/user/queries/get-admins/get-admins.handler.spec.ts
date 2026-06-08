import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { RoleType } from '../../../../constants/role-type.ts';
import { GetAdminsHandler } from './get-admins.handler.ts';

describe('GetAdminsHandler', () => {
  let handler: GetAdminsHandler;
  let where: jest.Mock;
  let getMany: jest.Mock<() => Promise<unknown>>;
  const dtos = [{ id: 'admin-1', role: RoleType.ADMIN }];

  beforeEach(() => {
    /*
     * `.toDtos()` is the Array prototype polyfill (ADR-0009); mock it on the
     * returned array rather than loading the global augmentation in the unit.
     */
    const adminRows = Object.assign([{ role: RoleType.ADMIN }], {
      toDtos: jest.fn().mockReturnValue(dtos),
    });
    const qb: Record<string, unknown> = {};
    where = jest.fn().mockReturnValue(qb);
    qb.where = where;
    qb.orderBy = jest.fn().mockReturnValue(qb);
    getMany = jest.fn<() => Promise<unknown>>().mockResolvedValue(adminRows);
    qb.getMany = getMany;

    handler = new GetAdminsHandler({
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    } as never);
  });

  it('queries only ADMIN-role users and maps to DTOs', async () => {
    const result = await handler.execute();

    expect(where).toHaveBeenCalledWith('user.role = :role', {
      role: RoleType.ADMIN,
    });
    expect(result).toBe(dtos);
    expect(result[0]!.role).toBe(RoleType.ADMIN);
  });
});
