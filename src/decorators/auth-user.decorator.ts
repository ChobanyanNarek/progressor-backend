import type { ExecutionContext } from '@nestjs/common';
import { createParamDecorator } from '@nestjs/common';

import type { UserEntity } from '../modules/user/user.entity.ts';

type RequestUser = UserEntity & Record<symbol, unknown>;

export function AuthUser(): ParameterDecorator {
  return createParamDecorator(
    (_data: unknown, context: ExecutionContext): UserEntity | undefined => {
      const request = context
        .switchToHttp()
        .getRequest<{ user?: RequestUser }>();

      const user = request.user;

      if (user?.[Symbol.for('isPublic')]) {
        return undefined;
      }

      return user;
    },
  )();
}
