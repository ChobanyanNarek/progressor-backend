import type { ValidationOptions } from 'class-validator';
import {
  IsPhoneNumber as isPhoneNumber,
  registerDecorator,
  ValidateIf,
} from 'class-validator';
import _ from 'lodash';

export function IsPassword(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (object, propertyName) => {
    registerDecorator({
      propertyName: propertyName as string,
      name: 'isPassword',
      target: object.constructor,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: string) {
          return /^[\d!#$%&*@A-Z^a-z]*$/.test(value);
        },
      },
    });
  };
}

export function IsPhoneNumber(
  validationOptions?: ValidationOptions & {
    region?: Parameters<typeof isPhoneNumber>[0];
  },
): PropertyDecorator {
  return isPhoneNumber(validationOptions?.region, {
    message: 'error.phoneNumber',
    ...validationOptions,
  });
}

export function IsTmpKey(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (object, propertyName) => {
    registerDecorator({
      propertyName: propertyName as string,
      name: 'tmpKey',
      target: object.constructor,
      options: validationOptions,
      validator: {
        validate(value: string): boolean {
          return _.isString(value) && value.startsWith('tmp/');
        },
        defaultMessage(): string {
          return 'error.invalidTmpKey';
        },
      },
    });
  };
}

/**
 * Validates that this Date property is greater than or equal to a sibling Date
 * property (e.g. `to >= from`). Passes when either side is absent — combine with
 * the field's own optionality to only enforce the bound when both are supplied.
 */
export function IsDateAfterOrEqual(
  siblingProperty: string,
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (object, propertyName) => {
    registerDecorator({
      propertyName: propertyName as string,
      name: 'isDateAfterOrEqual',
      target: object.constructor,
      constraints: [siblingProperty],
      options: validationOptions,
      validator: {
        validate(value: unknown, args): boolean {
          if (!args) {
            return true;
          }

          const sibling = (args.object as Record<string, unknown>)[
            args.constraints[0] as string
          ];

          if (!(value instanceof Date) || !(sibling instanceof Date)) {
            return true;
          }

          return value.getTime() >= sibling.getTime();
        },
        defaultMessage(): string {
          return 'error.fields.is_date_after_or_equal';
        },
      },
    });
  };
}

export function IsUndefinable(options?: ValidationOptions): PropertyDecorator {
  return ValidateIf((_obj, value) => value !== undefined, options);
}

export function IsNullable(options?: ValidationOptions): PropertyDecorator {
  return ValidateIf((_obj, value) => value !== null, options);
}
