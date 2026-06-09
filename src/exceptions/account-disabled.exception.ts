import { ForbiddenException } from '@nestjs/common';

export class AccountDisabledException extends ForbiddenException {
  constructor(error?: string) {
    super('error.accountDisabled', error);
  }
}
