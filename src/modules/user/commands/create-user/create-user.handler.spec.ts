import { jest } from '@jest/globals';

import { AccountStatus } from '../../../../constants/account-status.ts';
import { RoleType } from '../../../../constants/role-type.ts';
import type { CreateUserDto } from '../../dtos/create-user.dto.ts';
import { CreateUserResultDto } from '../../dtos/create-user-result.dto.ts';
import { UserExistsException } from '../../exceptions/user-exists.exception.ts';
import { CreateUserCommand } from './create-user.command.ts';
import { CreateUserHandler } from './create-user.handler.ts';

describe('CreateUserHandler', () => {
  const dto: CreateUserDto = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@test.com',
    password: 'secret123',
    role: RoleType.CREATOR,
    status: AccountStatus.ACTIVE,
  };

  let handler: CreateUserHandler;
  let where: jest.Mock;
  let getOne: jest.Mock;
  let create: jest.Mock;
  let save: jest.Mock;

  beforeEach(() => {
    getOne = jest.fn<() => Promise<unknown>>();
    const qb: Record<string, unknown> = {};
    where = jest.fn().mockReturnValue(qb);
    qb.where = where;
    qb.getOne = getOne;
    create = jest.fn();
    save = jest.fn<() => Promise<unknown>>().mockResolvedValue(undefined);

    handler = new CreateUserHandler({
      createQueryBuilder: jest.fn().mockReturnValue(qb),
      create,
      save,
    } as never);
  });

  it('throws UserExistsException when the email already exists, without creating', async () => {
    getOne.mockResolvedValue({ id: 'existing' });

    await expect(
      handler.execute(new CreateUserCommand(dto)),
    ).rejects.toBeInstanceOf(UserExistsException);

    expect(create).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });

  it('creates, saves, and returns the new user id when the email is free', async () => {
    getOne.mockResolvedValue(null);
    const created = { id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' as Uuid };
    create.mockReturnValue(created);

    const result = await handler.execute(new CreateUserCommand(dto));

    expect(where).toHaveBeenCalledWith('user.email = :email', {
      email: dto.email,
    });
    expect(create).toHaveBeenCalledWith({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      password: dto.password,
      role: dto.role,
      status: dto.status,
    });
    expect(save).toHaveBeenCalledWith(created);
    // Returns a CreateUserResultDto carrying the new user id (validated by
    // BaseDto.create, so the id must be a real UUID).
    expect(result).toBeInstanceOf(CreateUserResultDto);
    expect(result).toEqual({ id: created.id });
  });
});
