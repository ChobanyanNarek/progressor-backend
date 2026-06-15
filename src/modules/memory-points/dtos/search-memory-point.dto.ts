import { BaseDto } from '../../../common/dto/base.dto.ts';
import { MemoryPointStatus } from '../../../constants/memory-point-status.ts';
import {
  ClassField,
  DateField,
  EnumField,
  StringFieldOptional,
  UUIDField,
} from '../../../decorators/field.decorators.ts';
import { GeoPointDto } from './geo-point.dto.ts';

/**
 * Result row for the location-free name search (TICKET-05). Mirrors the nearby
 * shape minus `distance` (irrelevant without a reference point); kept as its own
 * class so each endpoint owns a distinct response DTO (awesome-nest/unique-endpoint-dtos).
 */
export class SearchMemoryPointDto extends BaseDto {
  @UUIDField()
  id!: Uuid;

  @ClassField(() => GeoPointDto)
  location!: GeoPointDto;

  @EnumField(() => MemoryPointStatus)
  status!: MemoryPointStatus;

  @StringFieldOptional()
  title?: string;

  @StringFieldOptional()
  description?: string;

  @DateField()
  createdAt!: Date;

  @DateField()
  updatedAt!: Date;
}
