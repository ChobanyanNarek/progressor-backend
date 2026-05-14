import { DateField } from '../../../decorators/field.decorators.ts';

export class UpdateUserDto {
  @DateField()
  readonly lastLogin!: Date;
}
