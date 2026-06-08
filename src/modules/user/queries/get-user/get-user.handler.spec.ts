import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { UserNotFoundException } from '../../../../exceptions/user-not-found.exception.ts';
import { GetUserHandler } from './get-user.handler.ts';
import { GetUserQuery } from './get-user.query.ts';

describe('GetUserHandler', () => {
  const userId = 'user-1' as Uuid;
  const dto = { id: userId };

  let handler: GetUserHandler;
  let where: jest.Mock;
  let getOne: jest.Mock<() => Promise<unknown>>;

  beforeEach(() => {
    getOne = jest.fn<() => Promise<unknown>>();
    const qb: Record<string, unknown> = {};
    where = jest.fn().mockReturnValue(qb);
    qb.where = where;
    qb.getOne = getOne;

    handler = new GetUserHandler({
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    } as never);
  });

  it('returns the mapped DTO for the matching user', async () => {
    const toDto = jest.fn().mockReturnValue(dto);
    getOne.mockResolvedValue({ toDto });

    const result = await handler.execute(new GetUserQuery(userId));

    expect(where).toHaveBeenCalledWith('user.id = :userId', { userId });
    expect(toDto).toHaveBeenCalledTimes(1);
    expect(result).toBe(dto);
  });

  it('throws UserNotFoundException when no user matches', async () => {
    getOne.mockResolvedValue(null);

    await expect(
      handler.execute(new GetUserQuery(userId)),
    ).rejects.toBeInstanceOf(UserNotFoundException);
  });
});
