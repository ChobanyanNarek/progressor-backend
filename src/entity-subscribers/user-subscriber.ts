import type {
  EntitySubscriberInterface,
  InsertEvent,
  UpdateEvent,
} from 'typeorm';
import { EventSubscriber } from 'typeorm';

import { generateHash } from '../common/utils.ts';
import { UserEntity } from '../modules/user/user.entity.ts';

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<UserEntity> {
  listenTo(): typeof UserEntity {
    return UserEntity;
  }

  beforeInsert(event: InsertEvent<UserEntity>): void {
    if (event.entity.password) {
      event.entity.password = generateHash(event.entity.password);
    }
  }

  beforeUpdate(event: UpdateEvent<UserEntity>): void {
    const entity = event.entity as UserEntity;
    const dbEntity = event.databaseEntity as UserEntity | undefined;

    if (
      entity.password &&
      dbEntity?.password &&
      entity.password !== dbEntity.password
    ) {
      entity.password = generateHash(entity.password);
    }
  }
}
