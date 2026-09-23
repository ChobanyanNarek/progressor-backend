import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PmTrackerCredentialListDto } from '../../dtos/pm-tracker-credential-list.dto.ts';
import { PmTrackerCredentialEntity } from '../../entities/pm-tracker-credential.entity.ts';
import { CredentialCipherService } from '../../services/credential-cipher.service.ts';
import { ListCredentialsQuery } from './list-credentials.query.ts';

@Injectable()
@QueryHandler(ListCredentialsQuery)
export class ListCredentialsHandler
  implements IQueryHandler<ListCredentialsQuery>
{
  constructor(
    @InjectRepository(PmTrackerCredentialEntity)
    private readonly repo: Repository<PmTrackerCredentialEntity>,
    private readonly cipher: CredentialCipherService,
  ) {}

  async execute(
    query: ListCredentialsQuery,
  ): Promise<PmTrackerCredentialListDto> {
    // The secret column is never selected: this list must not be able to leak it.
    const rows = await this.repo
      .createQueryBuilder('c')
      .select([
        'c.id',
        'c.createdAt',
        'c.updatedAt',
        'c.connectionId',
        'c.provider',
      ])
      .where('c.user_id = :userId', { userId: query.userId })
      .getMany();

    return PmTrackerCredentialListDto.create({
      items: rows.map((row) => ({
        connectionId: row.connectionId,
        provider: row.provider,
      })),
      available: this.cipher.isAvailable,
    });
  }
}
