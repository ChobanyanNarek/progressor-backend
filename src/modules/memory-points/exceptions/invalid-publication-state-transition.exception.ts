import { BadRequestException } from '@nestjs/common';

export class InvalidPublicationStateTransitionException extends BadRequestException {
  constructor(error?: string) {
    super('error.invalidPublicationStateTransition', error);
  }
}
