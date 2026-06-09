import { ForbiddenException } from '@nestjs/common';

export class MemoryPointNotOwnedException extends ForbiddenException {
  constructor(error?: string) {
    super('error.memoryPointNotOwned', error);
  }
}
