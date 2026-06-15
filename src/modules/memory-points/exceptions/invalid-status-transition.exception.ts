import { BadRequestException } from '@nestjs/common';

export class InvalidStatusTransitionException extends BadRequestException {
  constructor(error?: string) {
    super('error.invalidStatusTransition', error);
  }
}
