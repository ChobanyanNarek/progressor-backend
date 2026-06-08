import { ForbiddenException } from '@nestjs/common';

export class CannotRemoveSelfException extends ForbiddenException {
  constructor(error?: string) {
    super('error.cannotRemoveSelf', error);
  }
}
