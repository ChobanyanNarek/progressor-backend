import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  type Relation,
} from 'typeorm';

import { AbstractEntity } from '../../../common/abstract.entity.ts';
import { MemoryPointType } from '../../../constants/memory-point-type.ts';
import { UseDto } from '../../../decorators/use-dto.decorator.ts';
import { MemoryPointDetailsDto } from '../dtos/memory-point-details.dto.ts';
import type { IMemoryPointDetailsOptions } from '../interfaces/memory-point-details-options.interface.ts';
import { MemoryPointEntity } from './memory-point.entity.ts';

@Entity({ name: 'memory_point_details' })
// created_at: ORDER BY in the admin media list.
@Index(['createdAt'])
@UseDto(MemoryPointDetailsDto)
export class MemoryPointDetailsEntity extends AbstractEntity<
  MemoryPointDetailsDto,
  IMemoryPointDetailsOptions
> {
  @Column({ type: 'varchar', nullable: true })
  title?: string;

  @Column({ type: 'varchar', nullable: true })
  description?: string;

  @Column({ type: 'varchar', nullable: true })
  cloudAnchorId?: string;

  /**
   * GCS object path of the uploaded face image, used as D-ID source.
   * Nullable so an admin can create a metadata-only details row before media
   * is uploaded; the creator submission flow still validates presence, so the
   * "ADMIN_REVIEWING+ has sources" invariant holds.
   */
  @Column({ type: 'varchar', nullable: true })
  sourcePhotoUrl?: string | null;

  /** GCS object path of the uploaded audio, used as the D-ID script. */
  @Column({ type: 'varchar', nullable: true })
  sourceAudioUrl?: string | null;

  @Column({ type: 'varchar', nullable: true })
  videoUrl?: string;

  /**
   * Nullable so an admin can create a metadata-only details row (title /
   * description) on a fresh point before the type is chosen; the creator
   * submission flow always supplies it.
   */
  @Column({
    type: 'enum',
    enum: MemoryPointType,
    nullable: true,
  })
  type?: MemoryPointType | null;

  @Column({ type: 'uuid' })
  memoryPointId!: Uuid;

  @OneToOne(
    () => MemoryPointEntity,
    (memoryPoint) => memoryPoint.memoryPointDetails,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'memory_point_id' })
  memoryPoint!: Relation<MemoryPointEntity>;
}
