import { BadRequestException } from '@nestjs/common';

export class MemoryPointSourceNotUploadedException extends BadRequestException {
  constructor(error?: string) {
    super('error.memoryPointSourceNotUploaded', error);
  }
}
