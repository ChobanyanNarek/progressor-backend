import { Order } from '../../constants/order.ts';
import {
  EnumFieldOptional,
  NumberFieldOptional,
  StringFieldOptional,
} from '../../decorators/field.decorators.ts';
import { BaseDto } from './base.dto.ts';

export class PageOptionsDto extends BaseDto {
  @EnumFieldOptional(() => Order, {
    default: Order.ASC,
  })
  readonly order!: Order;

  @NumberFieldOptional({
    min: 1,
    default: 1,
    int: true,
  })
  readonly page!: number;

  @NumberFieldOptional({
    min: 1,
    max: 50,
    default: 10,
    int: true,
  })
  readonly take!: number;

  get skip(): number {
    return (this.page - 1) * this.take;
  }

  @StringFieldOptional()
  readonly q?: string;
}
