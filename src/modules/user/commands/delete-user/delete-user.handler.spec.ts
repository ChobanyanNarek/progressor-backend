import { jest } from '@jest/globals';

import { UserNotFoundException } from '../../../../exceptions/user-not-found.exception.ts';
import { DeleteUserCommand } from './delete-user.command.ts';
import { DeleteUserHandler } from './delete-user.handler.ts';

describe('DeleteUserHandler', () => {
  const userId = '11111111-1111-4111-8111-111111111111' as Uuid;

  let getOne: jest.Mock;
  let remove: jest.Mock;
  let handler: DeleteUserHandler;

  beforeEach(() => {
    getOne = jest.fn<() => Promise<unknown>>();
    const qb: Record<string, unknown> = {};
    qb.where = jest.fn().mockReturnValue(qb);
    qb.getOne = getOne;
    remove = jest.fn<() => Promise<unknown>>().mockResolvedValue(undefined);

    handler = new DeleteUserHandler({
      createQueryBuilder: jest.fn().mockReturnValue(qb),
      remove,
    } as never);
  });

  it('throws UserNotFoundException and does not remove when the user is missing', async () => {
    getOne.mockResolvedValue(null);

    await expect(
      handler.execute(new DeleteUserCommand(userId)),
    ).rejects.toBeInstanceOf(UserNotFoundException);
    expect(remove).not.toHaveBeenCalled();
  });

  it('removes the user when found', async () => {
    const user = { id: userId };
    getOne.mockResolvedValue(user);

    await handler.execute(new DeleteUserCommand(userId));

    expect(remove).toHaveBeenCalledWith(user);
  });
});
