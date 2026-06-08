import { BaseDto } from '../../../common/dto/base.dto.ts';
import { MemoryPointStatus } from '../../../constants/memory-point-status.ts';
import {
  DateField,
  EnumField,
  StringFieldOptional,
  UUIDField,
} from '../../../decorators/field.decorators.ts';

export class RecentMemoryPointDto extends BaseDto {
  @UUIDField()
  id!: Uuid;

  @StringFieldOptional({ nullable: true })
  title!: string | null;

  @EnumField(() => MemoryPointStatus)
  status!: MemoryPointStatus;

  @DateField()
  createdAt!: Date;
}
