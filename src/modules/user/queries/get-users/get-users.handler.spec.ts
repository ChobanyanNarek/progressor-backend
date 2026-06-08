import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { PageDto } from '../../../../common/dto/page.dto.ts';
import { AccountStatus } from '../../../../constants/account-status.ts';
import { RoleType } from '../../../../constants/role-type.ts';
import { UserListDto } from '../../dtos/user-list.dto.ts';
import type { UsersPageOptionsDto } from '../../dtos/users-page-options.dto.ts';
import { GetUsersHandler } from './get-users.handler.ts';
import { GetUsersQuery } from './get-users.query.ts';

describe('GetUsersHandler', () => {
  const meta = { itemCount: 1 };
  const userRow = {
    id: '11111111-1111-4111-8111-111111111111',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@test.com',
    role: RoleType.CREATOR,
    status: AccountStatus.ACTIVE,
    avatar: null,
    lastLogin: new Date('2026-01-03T00:00:00.000Z'),
    // Sensitive column present on the entity row — must NOT reach the DTO.
    // eslint-disable-next-line sonarjs/no-hardcoded-passwords -- throwaway test fixture
    password: 'hashed-secret',
  };

  let handler: GetUsersHandler;
  let where: jest.Mock;
  let searchByString: jest.Mock;
  let paginate: jest.Mock;

  beforeEach(() => {
    const qb: Record<string, unknown> = {};
    where = jest.fn().mockReturnValue(qb);
    searchByString = jest.fn().mockReturnValue(qb);
    paginate = jest
      .fn<() => Promise<unknown>>()
      .mockResolvedValue([[userRow], meta]);
    qb.where = where;
    qb.searchByString = searchByString;
    qb.paginate = paginate;

    handler = new GetUsersHandler({
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    } as never);
  });

  it('defaults the role to CREATOR and skips search when q is absent', async () => {
    const result = await handler.execute(
      new GetUsersQuery({} as UsersPageOptionsDto),
    );

    expect(where).toHaveBeenCalledWith('role = :role', {
      role: RoleType.CREATOR,
    });
    expect(searchByString).not.toHaveBeenCalled();
    expect(paginate).toHaveBeenCalledTimes(1);

    expect(result).toBeInstanceOf(PageDto);
    expect(result.data[0]).toBeInstanceOf(UserListDto);
    expect(result.data[0]!.email).toBe('john@test.com');
    expect(result.meta).toBe(meta);
  });

  it('maps list fields and never exposes the password', async () => {
    const result = await handler.execute(
      new GetUsersQuery({} as UsersPageOptionsDto),
    );

    const row = result.data[0];

    expect(row).not.toHaveProperty('password');
    expect(Object.keys(row)).not.toContain('password');
    // Non-sensitive fields the admin UI relies on are still present.
    expect(row.id).toBe('11111111-1111-4111-8111-111111111111');
    expect(row.role).toBe(RoleType.CREATOR);
    expect(row.status).toBe(AccountStatus.ACTIVE);
    expect(row.lastLogin).toEqual(new Date('2026-01-03T00:00:00.000Z'));
  });

  it('uses the requested role and searches when q is present', async () => {
    await handler.execute(
      new GetUsersQuery({
        role: RoleType.ADMIN,
        q: 'jo',
      } as UsersPageOptionsDto),
    );

    expect(where).toHaveBeenCalledWith('role = :role', {
      role: RoleType.ADMIN,
    });
    expect(searchByString).toHaveBeenCalledWith('jo', ['firstName', 'email']);
  });
});
