import { BaseDto } from '../../../common/dto/base.dto.ts';
import { ClassField } from '../../../decorators/field.decorators.ts';
import { UploadTargetDto } from './upload-target.dto.ts';

export class MemoryPointUploadUrlsDto extends BaseDto {
  @ClassField(() => UploadTargetDto)
  photo!: UploadTargetDto;

  @ClassField(() => UploadTargetDto)
  audio!: UploadTargetDto;
}
