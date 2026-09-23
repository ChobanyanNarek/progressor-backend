import { Injectable, NotFoundException } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PmTrackerCredentialEntity } from '../../entities/pm-tracker-credential.entity.ts';
import { CredentialCipherService } from '../../services/credential-cipher.service.ts';
import { ResolveCredentialQuery } from './resolve-credential.query.ts';

/**
 * Internal only: decrypts a stored token for a proxy call made on the user's behalf. Never
 * exposed as an endpoint -- the plaintext goes straight to the provider and nowhere else.
 */
@Injectable()
@QueryHandler(ResolveCredentialQuery)
export class ResolveCredentialHandler
  implements IQueryHandler<ResolveCredentialQuery>
{
  constructor(
    @InjectRepository(PmTrackerCredentialEntity)
    private readonly repo: Repository<PmTrackerCredentialEntity>,
    private readonly cipher: CredentialCipherService,
  ) {}

  async execute(query: ResolveCredentialQuery): Promise<string> {
    const row = await this.repo
      .createQueryBuilder('c')
      .where('c.user_id = :userId AND c.connection_id = :connectionId', {
        userId: query.userId,
        connectionId: query.connectionId,
      })
      .getOne();

    if (!row) {
      throw new NotFoundException('error.credentialNotFound');
    }

    return this.cipher.decrypt(row.secret);
  }
}
