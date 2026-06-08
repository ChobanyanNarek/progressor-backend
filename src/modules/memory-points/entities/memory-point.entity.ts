import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  type Relation,
} from 'typeorm';

import { AbstractEntity } from '../../../common/abstract.entity.ts';
import { MemoryPointStatus } from '../../../constants/memory-point-status.ts';
import { UseDto } from '../../../decorators/use-dto.decorator.ts';
import { UserEntity } from '../../user/user.entity.ts';
import { GeoPointDto } from '../dtos/geo-point.dto.ts';
import { MemoryPointDto } from '../dtos/memory-point.dto.ts';
import type { IMemoryPointOptions } from '../interfaces/memory-point-options.interface.ts';
import { MemoryPointDetailsEntity } from './memory-point-details.entity.ts';

@Entity({ name: 'memory_points' })
// created_at: ORDER BY in recent-points / admin list (was a disk-spilling sort).
@Index(['createdAt'])
// status: dashboard per-status counts and status-filtered lists.
@Index(['status'])
@UseDto(MemoryPointDto)
export class MemoryPointEntity extends AbstractEntity<
  MemoryPointDto,
  IMemoryPointOptions
> {
  @Index({ spatial: true })
  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: false,
  })
  location!: GeoPointDto;

  @Column({
    type: 'enum',
    enum: MemoryPointStatus,
    default: MemoryPointStatus.PENDING,
  })
  status!: MemoryPointStatus;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: Uuid;

  @OneToOne(() => MemoryPointDetailsEntity, (details) => details.memoryPoint, {
    cascade: true,
    eager: false,
  })
  memoryPointDetails?: Relation<MemoryPointDetailsEntity>;

  @ManyToOne(() => UserEntity, (user) => user.memoryPoints, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: Relation<UserEntity>;
}
