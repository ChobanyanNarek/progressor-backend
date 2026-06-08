import { beforeAll, describe, expect, it, jest } from '@jest/globals';
import { Reflector } from '@nestjs/core';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { RoleType } from '../../constants/role-type.ts';
import { RolesGuard } from '../../guards/roles.guard.ts';
import type { UserEntity } from '../user/user.entity.ts';
import { UserService } from '../user/user.service.ts';
import { AuthController } from './auth.controller.ts';
import { AuthService } from './auth.service.ts';

describe('AuthController', () => {
  let controller: AuthController;

  beforeAll(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        Reflector,
        {
          provide: AuthService,
          useValue: { validateUser: jest.fn(), createAccessToken: jest.fn() },
        },
        { provide: UserService, useValue: { createUser: jest.fn() } },
        {
          provide: RolesGuard,
          useValue: { canActivate: jest.fn().mockReturnValue(true) },
        },
      ],
    }).compile();

    controller = app.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getCurrentUser returns the user id so clients need not decode the token', () => {
    const user = {
      id: '11111111-1111-4111-8111-111111111111',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@test.com',
      role: RoleType.ADMIN,
      avatar: null,
    } as UserEntity;

    const result = controller.getCurrentUser(user);

    expect(result.id).toBe('11111111-1111-4111-8111-111111111111');
    expect(result.email).toBe('john@test.com');
  });
});
