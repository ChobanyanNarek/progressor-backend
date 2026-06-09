import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  type Relation,
} from 'typeorm';

import { AbstractEntity } from '../../common/abstract.entity.ts';
import { AiGenerationStatus } from '../../constants/ai-generation-status.ts';
import { UseDto } from '../../decorators/use-dto.decorator.ts';
import { MemoryPointEntity } from '../memory-points/entities/memory-point.entity.ts';
import { MemoryPointAiGenerationDto } from './dtos/memory-point-ai-generation.dto.ts';

@Entity({ name: 'memory_point_ai_generations' })
@UseDto(MemoryPointAiGenerationDto)
export class MemoryPointAiGenerationEntity extends AbstractEntity<MemoryPointAiGenerationDto> {
  @Index('UQ_mpag_memory_point_id', { unique: true })
  @Column({ type: 'uuid' })
  memoryPointId!: Uuid;

  @Index('UQ_mpag_did_talk_id', {
    unique: true,
    where: '"did_talk_id" IS NOT NULL',
  })
  @Column({ type: 'varchar', nullable: true })
  didTalkId?: string;

  @Column({
    type: 'enum',
    enum: AiGenerationStatus,
    default: AiGenerationStatus.PENDING,
  })
  status!: AiGenerationStatus;

  @Column({ type: 'varchar', nullable: true })
  resultVideoUrl?: string;

  @Column({ type: 'varchar', nullable: true })
  errorMessage?: string;

  @Column({ type: 'varchar', nullable: true })
  userData?: string;

  @Column({ type: 'float', nullable: true })
  durationSeconds?: number;

  @Column({ type: 'int', default: 1 })
  attemptNumber!: number;

  /**
   * Modelled as ManyToOne + a unique index (`UQ_mpag_memory_point_id`) rather
   * than OneToOne: uniqueness is enforced by the index (one generation per
   * point), and ManyToOne avoids the OneToOne-implied unique *constraint* that
   * TypeORM would otherwise try to add on top of the existing unique index.
   */
  @ManyToOne(() => MemoryPointEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'memory_point_id',
    foreignKeyConstraintName: 'FK_mpag_memory_point',
  })
  memoryPoint!: Relation<MemoryPointEntity>;
}
