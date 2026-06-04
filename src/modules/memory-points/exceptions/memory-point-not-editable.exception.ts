import { ForbiddenException } from '@nestjs/common';

export class MemoryPointNotEditableException extends ForbiddenException {
  constructor(error?: string) {
    super('error.memoryPointNotEditable', error);
  }
}
