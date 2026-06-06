import type { Type } from '@nestjs/common';
import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';
import type {
  ReferenceObject,
  SchemaObject,
} from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import _ from 'lodash';

import type { IApiFile } from '../interfaces/i-api-file.ts';

const PARAMTYPES_METADATA = 'design:paramtypes';

interface RouteArgMetadata {
  index: number;
  data?: string;
}

interface ParameterWithType {
  type: Type<unknown> | undefined;
  name: string | undefined;
  required: boolean;
}

function reverseObjectKeys<T>(
  originalObject: Record<string, T>,
): Record<string, T> {
  const reversedObject: Record<string, T> = {};

  for (const [key, value] of Object.entries(originalObject).toReversed()) {
    reversedObject[key] = value;
  }

  return reversedObject;
}

const ROUTE_ARGS_METADATA = '__routeArguments__';

function explore(
  instance: object,
  propertyKey: string | symbol,
): Type<unknown> | undefined {
  const types =
    (Reflect.getMetadata(PARAMTYPES_METADATA, instance, propertyKey) as
      | Array<Type<unknown>>
      | undefined) ?? [];
  const routeArgsMetadata =
    (Reflect.getMetadata(
      ROUTE_ARGS_METADATA,
      instance.constructor,
      propertyKey,
    ) as Record<string, RouteArgMetadata> | undefined) ?? {};

  const parametersWithType = _.mapValues(
    reverseObjectKeys(routeArgsMetadata),
    (param): ParameterWithType => ({
      type: types[param.index],
      name: param.data,
      required: true,
    }),
  );

  for (const [key, value] of Object.entries(parametersWithType)) {
    const keyPair = key.split(':');

    if (Number(keyPair[0]) === 3) {
      return value.type;
    }
  }

  return undefined;
}

function RegisterModels(): MethodDecorator {
  return (target, propertyKey, descriptor: PropertyDescriptor) => {
    const body = explore(target, propertyKey);

    if (body) {
      ApiExtraModels(body)(target, propertyKey, descriptor);
    }
  };
}

function ApiFileDecorator(
  files: IApiFile[] = [],
  options: Partial<{ isRequired: boolean }> = {},
): MethodDecorator {
  return (target, propertyKey, descriptor: PropertyDescriptor) => {
    const { isRequired = false } = options;
    const fileSchema: SchemaObject = {
      type: 'string',
      format: 'binary',
    };
    const properties: Record<string, SchemaObject | ReferenceObject> = {};

    for (const file of files) {
      properties[file.name] = file.isArray
        ? {
            type: 'array',
            items: fileSchema,
          }
        : fileSchema;
    }

    let schema: SchemaObject = {
      properties,
      type: 'object',
    };
    const body = explore(target, propertyKey);

    if (body) {
      schema = {
        allOf: [
          {
            $ref: getSchemaPath(body),
          },
          { properties, type: 'object' },
        ],
      };
    }

    return ApiBody({
      schema,
      required: isRequired,
    })(target, propertyKey, descriptor);
  };
}

export function ApiFile(
  files: _.Many<IApiFile>,
  options: Partial<{ isRequired: boolean }> = {},
): MethodDecorator {
  const filesArray = _.castArray(files);
  const apiFileInterceptors = filesArray.map((file) =>
    file.isArray
      ? UseInterceptors(FilesInterceptor(file.name))
      : UseInterceptors(FileInterceptor(file.name)),
  );

  return applyDecorators(
    RegisterModels(),
    ApiConsumes('multipart/form-data'),
    ApiFileDecorator(filesArray, options),
    ...apiFileInterceptors,
  );
}
