import { jest } from '@jest/globals';

import { RoleType } from '../../../../constants/role-type.ts';
import { UserNotFoundException } from '../../../../exceptions/user-not-found.exception.ts';
import { UpdateUserRoleCommand } from './update-user-role.command.ts';
import { UpdateUserRoleHandler } from './update-user-role.handler.ts';

describe('UpdateUserRoleHandler', () => {
  const userId = '11111111-1111-4111-8111-111111111111' as Uuid;

  let getOne: jest.Mock<() => Promise<unknown>>;
  let save: jest.Mock<() => Promise<void>>;
  let handler: UpdateUserRoleHandler;

  beforeEach(() => {
    getOne = jest.fn<() => Promise<unknown>>();
    const qb: Record<string, unknown> = {};
    qb.where = jest.fn().mockReturnValue(qb);
    qb.getOne = getOne;
    save = jest.fn<() => Promise<void>>().mockResolvedValue();

    handler = new UpdateUserRoleHandler({
      createQueryBuilder: jest.fn().mockReturnValue(qb),
      save,
    } as never);
  });

  it('throws UserNotFoundException and does not save when the user is missing', async () => {
    getOne.mockResolvedValue(null);

    await expect(
      handler.execute(new UpdateUserRoleCommand(userId, RoleType.ADMIN)),
    ).rejects.toBeInstanceOf(UserNotFoundException);
    expect(save).not.toHaveBeenCalled();
  });

  it('sets the new role, saves, and returns the mapped DTO', async () => {
    const dto = { id: userId };
    const user = {
      id: userId,
      role: RoleType.CREATOR,
      toDto: jest.fn().mockReturnValue(dto),
    };
    getOne.mockResolvedValue(user);

    const result = await handler.execute(
      new UpdateUserRoleCommand(userId, RoleType.ADMIN),
    );

    expect(user.role).toBe(RoleType.ADMIN);
    expect(save).toHaveBeenCalledWith(user);
    expect(result).toBe(dto);
  });
});
