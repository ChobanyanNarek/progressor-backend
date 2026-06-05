import { jest } from '@jest/globals';

import type { UpdateUserDto } from '../../dtos/update-user.dto.ts';
import { UpdateUserCommand } from './update-user.command.ts';
import { UpdateUserHandler } from './update-user.handler.ts';

describe('UpdateUserHandler', () => {
  const userId = 'user-1' as Uuid;
  const lastLogin = new Date('2026-06-05T00:00:00.000Z');
  const dto: UpdateUserDto = { lastLogin };

  let handler: UpdateUserHandler;
  let update: jest.Mock;
  let set: jest.Mock;
  let where: jest.Mock;
  let execute: jest.Mock;

  beforeEach(() => {
    const qb: Record<string, unknown> = {};
    update = jest.fn().mockReturnValue(qb);
    set = jest.fn().mockReturnValue(qb);
    where = jest.fn().mockReturnValue(qb);
    execute = jest.fn<() => Promise<unknown>>().mockResolvedValue(undefined);
    qb.update = update;
    qb.set = set;
    qb.where = where;
    qb.execute = execute;

    handler = new UpdateUserHandler({
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    } as never);
  });

  it('updates lastLogin for the given user id', async () => {
    await handler.execute(new UpdateUserCommand(userId, dto));

    expect(set).toHaveBeenCalledWith({ lastLogin });
    expect(where).toHaveBeenCalledWith('id = :id', { id: userId });
    expect(execute).toHaveBeenCalledTimes(1);
  });
});
