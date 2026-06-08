import { Transform, TransformationType } from 'class-transformer';
import { parsePhoneNumberWithError } from 'libphonenumber-js';
import _ from 'lodash';

import { GeneratorProvider } from '../providers/generator.provider.ts';

type MaybeStringList = string | string[];
type MaybeStringListOrUndefined = MaybeStringList | undefined;

function trimValue(input: string, trimNewLines: boolean): string {
  const trimmedValue = input.trim();

  return trimNewLines ? trimmedValue.replaceAll(/\s\s+/g, ' ') : trimmedValue;
}

/**
 * @description trim spaces from start and end, replace multiple spaces with one.
 * @example
 * @ApiProperty()
 * @IsString()
 * @Trim()
 * name: string;
 * @returns PropertyDecorator
 * @constructor
 */
export function Trim(trimNewLines: boolean): PropertyDecorator {
  return Transform((params): unknown => {
    const value = params.value as MaybeStringList;

    if (!value) {
      return value;
    }

    if (Array.isArray(value)) {
      return value.map((v) => trimValue(v, trimNewLines));
    }

    return trimValue(value, trimNewLines);
  });
}

export function ToBoolean(): PropertyDecorator {
  return Transform(
    (params): unknown => {
      const value = params.value as unknown;

      switch (value) {
        case 'true': {
          return true;
        }

        case 'false': {
          return false;
        }

        default: {
          return value;
        }
      }
    },
    { toClassOnly: true },
  );
}

/**
 * @description convert string or number to integer
 * @example
 * @IsNumber()
 * @ToInt()
 * name: number;
 * @returns PropertyDecorator
 * @constructor
 */
export function ToInt(): PropertyDecorator {
  return Transform(
    (params) => {
      const value = params.value as string;

      return Number.parseInt(value, 10);
    },
    { toClassOnly: true },
  );
}

/**
 * @description transforms to array, specially for query params
 * @example
 * @IsNumber()
 * @ToArray()
 * name: number;
 * @constructor
 */
export function ToArray(): PropertyDecorator {
  return Transform(
    (params): unknown[] => {
      const value = params.value as unknown;

      if (!value) {
        return value as unknown[];
      }

      return _.castArray(value);
    },
    { toClassOnly: true },
  );
}

export function ToLowerCase(): PropertyDecorator {
  return Transform(
    (params): unknown => {
      const value = params.value as MaybeStringListOrUndefined;

      if (!value) {
        return;
      }

      if (!Array.isArray(value)) {
        return value.toLowerCase();
      }

      return value.map((v) => v.toLowerCase());
    },
    {
      toClassOnly: true,
    },
  );
}

export function ToUpperCase(): PropertyDecorator {
  return Transform(
    (params): unknown => {
      const value = params.value as MaybeStringListOrUndefined;

      if (!value) {
        return;
      }

      if (!Array.isArray(value)) {
        return value.toUpperCase();
      }

      return value.map((v) => v.toUpperCase());
    },
    {
      toClassOnly: true,
    },
  );
}

export function GcsUrlParser(): PropertyDecorator {
  return Transform((params) => {
    const key = params.value as string;

    switch (params.type) {
      case TransformationType.CLASS_TO_PLAIN: {
        return GeneratorProvider.getGcsPublicUrl(key);
      }

      case TransformationType.PLAIN_TO_CLASS: {
        return GeneratorProvider.getGcsKey(key);
      }

      default: {
        return key;
      }
    }
  });
}

export function PhoneNumberSerializer(): PropertyDecorator {
  return Transform(
    (params) => parsePhoneNumberWithError(params.value as string).number,
  );
}

export function LinkCleanupTransform(options?: {
  removeTrailingSlash?: boolean;
  removeQueryParams?: boolean;
}): PropertyDecorator {
  return Transform((params) => {
    let value = params.value as string;

    if (!value) {
      return value;
    }

    if (options?.removeQueryParams) {
      const queryIndex = value.indexOf('?');

      if (queryIndex !== -1) {
        value = value.slice(0, queryIndex);
      }
    }

    if (options?.removeTrailingSlash ?? true) {
      let end = value.length;

      while (end > 0 && value.codePointAt(end - 1) === 47 /* '/' */) {
        end -= 1;
      }

      value = value.slice(0, end);
    }

    return value;
  });
}
