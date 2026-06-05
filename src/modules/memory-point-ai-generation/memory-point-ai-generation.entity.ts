import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
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
  @Index({ unique: true })
  @Column({ type: 'uuid', name: 'memory_point_id' })
  memoryPointId!: Uuid;

  @Index({ unique: true, where: '"did_talk_id" IS NOT NULL' })
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

  @OneToOne(() => MemoryPointEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'memory_point_id' })
  memoryPoint!: Relation<MemoryPointEntity>;
}
