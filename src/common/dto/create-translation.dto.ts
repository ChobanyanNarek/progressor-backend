import { LanguageCode } from '../../constants/language-code.ts';
import { EnumField, StringField } from '../../decorators/field.decorators.ts';
import { BaseDto } from './base.dto.ts';

export class CreateTranslationDto extends BaseDto {
  @EnumField(() => LanguageCode)
  languageCode!: LanguageCode;

  @StringField()
  text!: string;
}
