import { UnauthorizedException } from '@nestjs/common';

export class InvalidCredentialsException extends UnauthorizedException {
  constructor(error?: string) {
    super('error.invalidCredentials', error);
  }
}
