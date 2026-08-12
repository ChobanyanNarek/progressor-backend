import { BaseDto } from '../../../common/dto/base.dto.ts';
import { StringField } from '../../../decorators/field.decorators.ts';

export class InitPaymentDto extends BaseDto {
  @StringField()
  paymentUrl!: string;

  @StringField()
  paymentId!: string;

  @StringField()
  orderId!: string;
}
