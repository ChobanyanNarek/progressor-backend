import { ForbiddenException } from '@nestjs/common';

export class CannotRemoveLastAdminException extends ForbiddenException {
  constructor(error?: string) {
    super('error.cannotRemoveLastAdmin', error);
  }
}
