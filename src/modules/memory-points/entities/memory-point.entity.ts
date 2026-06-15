import {
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  type Relation,
} from 'typeorm';

import { AbstractEntity } from '../../../common/abstract.entity.ts';
import { MemoryPointStatus } from '../../../constants/memory-point-status.ts';
import { PublicationState } from '../../../constants/publication-state.ts';
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
// publicationState: combined with status in all public visibility reads.
@Index(['publicationState'])
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

  /*
   * Independent visibility axis — never overloads the review-pipeline `status`.
   * ACTIVE: visible to public (requires status=APPROVED).
   * INACTIVE: hidden from public, creator-reversible.
   * ARCHIVED: terminal; admin can reactivate to INACTIVE or ACTIVE explicitly.
   */
  @Column({
    type: 'enum',
    enum: PublicationState,
    default: PublicationState.ACTIVE,
    name: 'publication_state',
  })
  publicationState!: PublicationState;

  /*
   * Soft-delete timestamp; TypeORM auto-excludes soft-deleted rows from all
   * query-builder reads unless .withDeleted() is explicitly added.
   */
  @DeleteDateColumn({
    type: 'timestamptz',
    name: 'deleted_at',
    nullable: true,
  })
  deletedAt?: Date | null;

  @Column({ type: 'uuid' })
  userId!: Uuid;

  @OneToOne(() => MemoryPointDetailsEntity, (details) => details.memoryPoint, {
    cascade: true,
    eager: false,
  })
  memoryPointDetails?: Relation<MemoryPointDetailsEntity>;

  /*
   * Optional in the type: only populated when a query explicitly joins it
   * (the `user_id` FK column is always set; the relation object is lazy).
   */
  @ManyToOne(() => UserEntity, (user) => user.memoryPoints, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user?: Relation<UserEntity>;
}
