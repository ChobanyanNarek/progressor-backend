import { BadRequestException, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PmTrackerCredentialEntity } from '../../entities/pm-tracker-credential.entity.ts';
import { CredentialCipherService } from '../../services/credential-cipher.service.ts';
import { SaveCredentialCommand } from './save-credential.command.ts';

const PROVIDERS = new Set(['jira', 'github', 'gitlab']);

@Injectable()
@CommandHandler(SaveCredentialCommand)
export class SaveCredentialHandler
  implements ICommandHandler<SaveCredentialCommand>
{
  constructor(
    @InjectRepository(PmTrackerCredentialEntity)
    private readonly repo: Repository<PmTrackerCredentialEntity>,
    private readonly cipher: CredentialCipherService,
  ) {}

  async execute(command: SaveCredentialCommand): Promise<void> {
    const { userId, connectionId, provider, secret } = command;

    if (!PROVIDERS.has(provider)) {
      throw new BadRequestException('error.invalidProvider');
    }

    // Encrypt before anything touches the database; throws 503 if no key is configured.
    const envelope = this.cipher.encrypt(secret.trim());

    await this.repo.upsert(
      { userId, connectionId, provider, secret: envelope },
      ['userId', 'connectionId'],
    );
  }
}
