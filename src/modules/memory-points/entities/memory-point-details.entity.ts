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

  @Column({ type: 'varchar', name: 'cloud_anchor_id', nullable: true })
  cloudAnchorId?: string;

  /** GCS object path of the uploaded face image, used as D-ID source. */
  @Column({ type: 'varchar', name: 'source_photo_url' })
  sourcePhotoUrl!: string;

  /** GCS object path of the uploaded audio, used as the D-ID script. */
  @Column({ type: 'varchar', name: 'source_audio_url' })
  sourceAudioUrl!: string;

  @Column({ type: 'varchar', nullable: true })
  videoUrl?: string;

  @Column({
    type: 'enum',
    enum: MemoryPointType,
  })
  type!: MemoryPointType;

  @Column({ type: 'uuid', name: 'memory_point_id' })
  memoryPointId!: Uuid;

  @OneToOne(
    () => MemoryPointEntity,
    (memoryPoint) => memoryPoint.memoryPointDetails,
  )
  @JoinColumn({ name: 'memory_point_id' })
  memoryPoint!: Relation<MemoryPointEntity>;
}
