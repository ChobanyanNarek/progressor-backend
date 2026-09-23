import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PmTrackerCredentialEntity } from '../../entities/pm-tracker-credential.entity.ts';
import { DeleteCredentialCommand } from './delete-credential.command.ts';

@Injectable()
@CommandHandler(DeleteCredentialCommand)
export class DeleteCredentialHandler
  implements ICommandHandler<DeleteCredentialCommand>
{
  constructor(
    @InjectRepository(PmTrackerCredentialEntity)
    private readonly repo: Repository<PmTrackerCredentialEntity>,
  ) {}

  async execute(command: DeleteCredentialCommand): Promise<void> {
    // Scoped to the user, so a connection id can never delete someone else's credential.
    await this.repo
      .createQueryBuilder()
      .delete()
      .where('user_id = :userId AND connection_id = :connectionId', {
        userId: command.userId,
        connectionId: command.connectionId,
      })
      .execute();
  }
}
