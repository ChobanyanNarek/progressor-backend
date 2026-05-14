import { ConflictException } from '@nestjs/common';

export class UserExistsException extends ConflictException {
  constructor(message = 'User already exists') {
    super(message);
  }
}
