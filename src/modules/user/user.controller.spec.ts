import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { AccountStatus } from '../../constants/account-status.ts';
import { RoleType } from '../../constants/role-type.ts';
import { UserController } from './user.controller.ts';

const VALID_UUID = '0190f8e2-0000-4000-8000-000000000000' as Uuid;

describe('UserController', () => {
  type ServiceMock = jest.Mock<(...args: unknown[]) => Promise<unknown>>;

  let userService: {
    getUsers: ServiceMock;
    create: ServiceMock;
    getUser: ServiceMock;
    editUser: ServiceMock;
    deleteUser: jest.Mock<(...args: unknown[]) => Promise<void>>;
    updateUserStatus: ServiceMock;
    updateUserRole: ServiceMock;
  };
  let controller: UserController;

  beforeEach(() => {
    userService = {
      getUsers: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
      create: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
      getUser: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
      editUser: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
      deleteUser: jest.fn<(...args: unknown[]) => Promise<void>>(),
      updateUserStatus: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
      updateUserRole: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    };
    controller = new UserController(userService as never);
  });

  describe('getUsers', () => {
    it('delegates the page options straight to the service', async () => {
      const pageOptionsDto = { page: 1, take: 10 } as never;
      const expected = { data: [], meta: {} };
      userService.getUsers.mockResolvedValue(expected);

      const result = await controller.getUsers(pageOptionsDto);

      expect(userService.getUsers).toHaveBeenCalledTimes(1);
      expect(userService.getUsers).toHaveBeenCalledWith(pageOptionsDto);
      expect(result).toBe(expected);
    });

    it('forwards a search query (q) so the list can be filtered', async () => {
      const pageOptionsDto = { page: 1, take: 10, q: 'jo' } as never;
      userService.getUsers.mockResolvedValue({ data: [], meta: {} });

      await controller.getUsers(pageOptionsDto);

      expect(userService.getUsers).toHaveBeenCalledWith(pageOptionsDto);
    });
  });

  describe('createUser', () => {
    it('delegates to the service create', async () => {
      const dto = { email: 'a@b.com' } as never;
      const expected = { id: VALID_UUID };
      userService.create.mockResolvedValue(expected);

      const result = await controller.createUser(dto);

      expect(userService.create).toHaveBeenCalledTimes(1);
      expect(userService.create).toHaveBeenCalledWith(dto);
      expect(result).toBe(expected);
    });
  });

  describe('getUser', () => {
    it('delegates to the service with the user id', async () => {
      const expected = { id: VALID_UUID };
      userService.getUser.mockResolvedValue(expected);

      const result = await controller.getUser(VALID_UUID);

      expect(userService.getUser).toHaveBeenCalledTimes(1);
      expect(userService.getUser).toHaveBeenCalledWith(VALID_UUID);
      expect(result).toBe(expected);
    });
  });

  describe('editUser', () => {
    it('delegates id and dto to the service', async () => {
      const dto = { firstName: 'Jane' } as never;
      const expected = { id: VALID_UUID, firstName: 'Jane' };
      userService.editUser.mockResolvedValue(expected);

      const result = await controller.editUser(VALID_UUID, dto);

      expect(userService.editUser).toHaveBeenCalledTimes(1);
      expect(userService.editUser).toHaveBeenCalledWith(VALID_UUID, dto);
      expect(result).toBe(expected);
    });
  });

  describe('deleteUser', () => {
    it('delegates to the service with the user id', async () => {
      userService.deleteUser.mockResolvedValue();

      await controller.deleteUser(VALID_UUID);

      expect(userService.deleteUser).toHaveBeenCalledTimes(1);
      expect(userService.deleteUser).toHaveBeenCalledWith(VALID_UUID);
    });
  });

  describe('updateUserStatus', () => {
    it('unwraps the status from the dto before delegating', async () => {
      const dto = { status: AccountStatus.DISABLED } as never;
      const expected = { id: VALID_UUID, status: AccountStatus.DISABLED };
      userService.updateUserStatus.mockResolvedValue(expected);

      const result = await controller.updateUserStatus(VALID_UUID, dto);

      expect(userService.updateUserStatus).toHaveBeenCalledTimes(1);
      expect(userService.updateUserStatus).toHaveBeenCalledWith(
        VALID_UUID,
        AccountStatus.DISABLED,
      );
      expect(result).toBe(expected);
    });
  });

  describe('updateUserRole', () => {
    it('unwraps the role from the dto before delegating', async () => {
      const dto = { role: RoleType.ADMIN } as never;
      const expected = { id: VALID_UUID, role: RoleType.ADMIN };
      userService.updateUserRole.mockResolvedValue(expected);

      const result = await controller.updateUserRole(VALID_UUID, dto);

      expect(userService.updateUserRole).toHaveBeenCalledTimes(1);
      expect(userService.updateUserRole).toHaveBeenCalledWith(
        VALID_UUID,
        RoleType.ADMIN,
      );
      expect(result).toBe(expected);
    });
  });
});
