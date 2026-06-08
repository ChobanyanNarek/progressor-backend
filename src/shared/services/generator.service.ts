import { randomBytes } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { v1 as uuid } from 'uuid';

@Injectable()
export class GeneratorService {
  public uuid(): string {
    return uuid();
  }

  public fileName(ext: string): string {
    return `${this.uuid()}.${ext}`;
  }

  /**
   * Cryptographically-random, URL-safe one-time password used when an admin is
   * invited without choosing a password. Returned once to the inviter to relay;
   * the user is expected to change it on first login.
   */
  public tempPassword(): string {
    return randomBytes(18).toString('base64url');
  }
}
