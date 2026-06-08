import { jest } from '@jest/globals';

import { AccountStatus } from '../../../../constants/account-status.ts';
import { UserNotFoundException } from '../../../../exceptions/user-not-found.exception.ts';
import { UpdateUserStatusCommand } from './update-user-status.command.ts';
import { UpdateUserStatusHandler } from './update-user-status.handler.ts';

describe('UpdateUserStatusHandler', () => {
  const userId = '11111111-1111-4111-8111-111111111111' as Uuid;

  let getOne: jest.Mock<() => Promise<unknown>>;
  let save: jest.Mock<() => Promise<void>>;
  let handler: UpdateUserStatusHandler;

  beforeEach(() => {
    getOne = jest.fn<() => Promise<unknown>>();
    const qb: Record<string, unknown> = {};
    qb.where = jest.fn().mockReturnValue(qb);
    qb.getOne = getOne;
    save = jest.fn<() => Promise<void>>().mockResolvedValue();

    handler = new UpdateUserStatusHandler({
      createQueryBuilder: jest.fn().mockReturnValue(qb),
      save,
    } as never);
  });

  it('throws UserNotFoundException and does not save when the user is missing', async () => {
    getOne.mockResolvedValue(null);

    await expect(
      handler.execute(
        new UpdateUserStatusCommand(userId, AccountStatus.DISABLED),
      ),
    ).rejects.toBeInstanceOf(UserNotFoundException);
    expect(save).not.toHaveBeenCalled();
  });

  it('sets the new status, saves, and returns the mapped DTO', async () => {
    const dto = { id: userId };
    const user = {
      id: userId,
      status: AccountStatus.ACTIVE,
      toDto: jest.fn().mockReturnValue(dto),
    };
    getOne.mockResolvedValue(user);

    const result = await handler.execute(
      new UpdateUserStatusCommand(userId, AccountStatus.DISABLED),
    );

    expect(user.status).toBe(AccountStatus.DISABLED);
    expect(save).toHaveBeenCalledWith(user);
    expect(result).toBe(dto);
  });
});
