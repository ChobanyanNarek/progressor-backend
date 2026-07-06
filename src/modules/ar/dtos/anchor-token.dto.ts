import { BaseDto } from '../../../common/dto/base.dto.ts';
import {
  DateField,
  StringField,
} from '../../../decorators/field.decorators.ts';

export class AnchorTokenDto extends BaseDto {
  @StringField()
  token!: string;

  @DateField()
  expiresAt!: Date;
}
