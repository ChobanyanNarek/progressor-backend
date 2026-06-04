import { NotFoundException } from '@nestjs/common';

export class MemoryPointNotFoundException extends NotFoundException {
  constructor(error?: string) {
    super('error.memoryPointNotFound', error);
  }
}
