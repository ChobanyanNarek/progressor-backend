import { jest } from '@jest/globals';

import { RoleType } from '../../../../constants/role-type.ts';
import { UserNotFoundException } from '../../../../exceptions/user-not-found.exception.ts';
import type { EditUserDto } from '../../dtos/edit-user.dto.ts';
import { UserExistsException } from '../../exceptions/user-exists.exception.ts';
import { EditUserCommand } from './edit-user.command.ts';
import { EditUserHandler } from './edit-user.handler.ts';

describe('EditUserHandler', () => {
  const userId = '11111111-1111-4111-8111-111111111111' as Uuid;

  let getOne: jest.Mock<() => Promise<unknown>>;
  let save: jest.Mock<() => Promise<void>>;
  let handler: EditUserHandler;

  beforeEach(() => {
    getOne = jest.fn<() => Promise<unknown>>();
    const qb: Record<string, unknown> = {};
    qb.where = jest.fn().mockReturnValue(qb);
    qb.getOne = getOne;
    save = jest.fn<() => Promise<void>>().mockResolvedValue();

    handler = new EditUserHandler({
      createQueryBuilder: jest.fn().mockReturnValue(qb),
      save,
    } as never);
  });

  function makeUser(): {
    id: Uuid;
    firstName: string;
    lastName: string;
    email: string;
    role: RoleType;
    avatar: string | null;
    dto: { id: Uuid };
    toDto: jest.Mock;
  } {
    const dto = { id: userId };

    return {
      id: userId,
      firstName: 'Old',
      lastName: 'Name',
      email: 'old@test.com',
      role: RoleType.CREATOR,
      avatar: null,
      dto,
      toDto: jest.fn().mockReturnValue(dto),
    };
  }

  it('throws UserNotFoundException and does not save when the user is missing', async () => {
    getOne.mockResolvedValue(null);

    await expect(
      handler.execute(new EditUserCommand(userId, {} as EditUserDto)),
    ).rejects.toBeInstanceOf(UserNotFoundException);
    expect(save).not.toHaveBeenCalled();
  });

  it('throws UserExistsException when the new email is already taken', async () => {
    getOne.mockResolvedValueOnce(makeUser()).mockResolvedValueOnce({
      id: 'other',
    });

    await expect(
      handler.execute(
        new EditUserCommand(userId, {
          email: 'taken@test.com',
        } as EditUserDto),
      ),
    ).rejects.toBeInstanceOf(UserExistsException);
    expect(save).not.toHaveBeenCalled();
  });

  it('applies only the provided fields and returns the mapped DTO', async () => {
    const user = makeUser();
    getOne.mockResolvedValue(user);

    const result = await handler.execute(
      new EditUserCommand(userId, {
        firstName: 'New',
        role: RoleType.ADMIN,
      } as EditUserDto),
    );

    expect(user.firstName).toBe('New');
    expect(user.role).toBe(RoleType.ADMIN);
    expect(user.lastName).toBe('Name');
    expect(user.email).toBe('old@test.com');
    expect(save).toHaveBeenCalledWith(user);
    expect(result).toBe(user.dto);
  });
});
