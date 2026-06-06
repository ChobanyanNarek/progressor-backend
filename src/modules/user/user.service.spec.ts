import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { CreateUserCommand } from './commands/create-user/create-user.command.ts';
import { UpdateUserCommand } from './commands/update-user/update-user.command.ts';
import type { CreateUserDto } from './dtos/create-user.dto.ts';
import type { UpdateUserDto } from './dtos/update-user.dto.ts';
import type { UsersPageOptionsDto } from './dtos/users-page-options.dto.ts';
import { GetUserQuery } from './queries/get-user/get-user.query.ts';
import { GetUsersQuery } from './queries/get-users/get-users.query.ts';
import { UserService } from './user.service.ts';

describe('UserService', () => {
  const userId = 'user-1' as Uuid;

  let service: UserService;
  let findOneBy: jest.Mock<(where: unknown) => Promise<unknown>>;
  let commandExecute: jest.Mock<(command: unknown) => Promise<unknown>>;
  let queryExecute: jest.Mock<(query: unknown) => Promise<unknown>>;

  beforeEach(() => {
    findOneBy = jest.fn<(where: unknown) => Promise<unknown>>();
    commandExecute = jest.fn<(command: unknown) => Promise<unknown>>();
    queryExecute = jest.fn<(query: unknown) => Promise<unknown>>();

    service = new UserService(
      { findOneBy } as never,
      { execute: commandExecute } as never,
      { execute: queryExecute } as never,
    );
  });

  it('findOne delegates to the repository', async () => {
    const user = { id: userId };
    findOneBy.mockResolvedValue(user);

    await expect(service.findOne({ email: 'a@b.com' })).resolves.toBe(user);
    expect(findOneBy).toHaveBeenCalledWith({ email: 'a@b.com' });
  });

  it('create dispatches a CreateUserCommand and returns its result', async () => {
    const dto = { email: 'a@b.com' } as CreateUserDto;
    commandExecute.mockResolvedValue({ id: userId });

    const result = await service.create(dto);

    expect(result).toEqual({ id: userId });
    const cmd = commandExecute.mock.calls[0]![0];
    expect(cmd).toBeInstanceOf(CreateUserCommand);
    expect((cmd as CreateUserCommand).createUserDto).toBe(dto);
  });

  it('update dispatches an UpdateUserCommand with the user id and dto', async () => {
    const dto = { lastLogin: new Date(0) } as UpdateUserDto;

    await service.update(userId, dto);

    const cmd = commandExecute.mock.calls[0]![0];
    expect(cmd).toBeInstanceOf(UpdateUserCommand);
    expect((cmd as UpdateUserCommand).userId).toBe(userId);
    expect((cmd as UpdateUserCommand).updateUserDto).toBe(dto);
  });

  it('getUser dispatches a GetUserQuery', async () => {
    await service.getUser(userId);

    const query = queryExecute.mock.calls[0]![0];
    expect(query).toBeInstanceOf(GetUserQuery);
    expect((query as GetUserQuery).userId).toBe(userId);
  });

  it('getUsers dispatches a GetUsersQuery', async () => {
    const opts = {} as UsersPageOptionsDto;

    await service.getUsers(opts);

    const query = queryExecute.mock.calls[0]![0];
    expect(query).toBeInstanceOf(GetUsersQuery);
    expect((query as GetUsersQuery).pageOptionsDto).toBe(opts);
  });
});
