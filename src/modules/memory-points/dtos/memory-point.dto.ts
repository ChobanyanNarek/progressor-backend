import { AbstractDto } from '../../../common/dto/abstract.dto.ts';
import { MemoryPointStatus } from '../../../constants/memory-point-status.ts';
import {
  ClassField,
  ClassFieldOptional,
  EnumField,
  UUIDField,
} from '../../../decorators/field.decorators.ts';
import type { MemoryPointEntity } from '../entities/memory-point.entity.ts';
import type { IMemoryPointOptions } from '../interfaces/memory-point-options.interface.ts';
import { CreatorSummaryDto } from './creator-summary.dto.ts';
import { GeoPointDto } from './geo-point.dto.ts';
import { MemoryPointDetailsDto } from './memory-point-details.dto.ts';

export class MemoryPointDto extends AbstractDto {
  @ClassField(() => GeoPointDto)
  location!: GeoPointDto;

  @EnumField(() => MemoryPointStatus)
  status!: MemoryPointStatus;

  @UUIDField()
  userId!: Uuid;

  @ClassFieldOptional(() => MemoryPointDetailsDto)
  memoryPointDetails?: MemoryPointDetailsDto;

  @ClassFieldOptional(() => CreatorSummaryDto)
  creator?: CreatorSummaryDto;

  constructor(entity: MemoryPointEntity, options?: IMemoryPointOptions) {
    super(entity);
    this.location = entity.location;
    this.status = entity.status;
    this.userId = entity.userId;
    this.memoryPointDetails = entity.memoryPointDetails?.toDto(options);
    this.creator = entity.user
      ? CreatorSummaryDto.create({
          id: entity.user.id,
          firstName: entity.user.firstName,
          lastName: entity.user.lastName,
          email: entity.user.email,
          avatar: entity.user.avatar,
        })
      : undefined;
  }
}
