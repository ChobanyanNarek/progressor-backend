import {
  Column,
  Entity,
  OneToMany,
  type Relation,
  VirtualColumn,
} from 'typeorm';

import { AbstractEntity } from '../../common/abstract.entity.ts';
import { AccountStatus } from '../../constants/account-status.ts';
import { RoleType } from '../../constants/role-type.ts';
import { UseDto } from '../../decorators/use-dto.decorator.ts';
import { MemoryPointEntity } from '../memory-points/entities/memory-point.entity.ts';
import { UserDto } from './dtos/user.dto.ts';

@Entity({ name: 'users' })
@UseDto(UserDto)
export class UserEntity extends AbstractEntity<UserDto> {
  @Column({ type: 'varchar', length: 50 })
  firstName!: string;

  @Column({ type: 'varchar', length: 50 })
  lastName!: string;

  @Column({ type: 'enum', enum: RoleType, default: RoleType.CREATOR })
  role!: RoleType;

  @Column({ unique: true, type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 255 })
  password!: string;

  @Column({ type: 'enum', enum: AccountStatus, default: AccountStatus.ACTIVE })
  status!: AccountStatus;

  @Column({ nullable: true, type: 'varchar' })
  avatar!: string | null;

  @Column({ type: 'timestamp', default: () => 'now()' })
  lastLogin!: Date;

  @VirtualColumn({
    query: (alias) =>
      `SELECT CONCAT(${alias}.first_name, ' ', ${alias}.last_name)`,
  })
  fullName!: string;

  @OneToMany(() => MemoryPointEntity, (memoryPoint) => memoryPoint.user)
  memoryPoints?: Relation<MemoryPointEntity[]>;
}
