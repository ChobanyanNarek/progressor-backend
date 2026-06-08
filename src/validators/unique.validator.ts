import { InjectDataSource } from '@nestjs/typeorm';
import type {
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraintInterface,
} from 'class-validator';
import { registerDecorator, ValidatorConstraint } from 'class-validator';
import type {
  DataSource,
  EntitySchema,
  FindOptionsWhere,
  ObjectType,
} from 'typeorm';

/**
 * Async class-validator constraint backing the `@Unique` decorator: asserts that
 * no matching row exists for the given entity/condition. Registered by the
 * `Unique` factory below, so the symbol is referenced internally and must not be
 * marked `@deprecated` (that would flag its own factory as using a deprecated
 * symbol).
 */
@ValidatorConstraint({ name: 'unique', async: true })
export class UniqueValidator implements ValidatorConstraintInterface {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  public async validate<E>(
    _value: string,
    args: IUniqueValidationArguments<E>,
  ): Promise<boolean> {
    const [entityClass, findCondition] = args.constraints;

    return (
      (await this.dataSource
        .getRepository(entityClass)
        .createQueryBuilder('entity')
        .setFindOptions({ where: findCondition(args) })
        .getCount()) <= 0
    );
  }

  defaultMessage(args: ValidationArguments): string {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const [entityClass] = args.constraints;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
    const entity = entityClass.name ?? 'Entity';

    return `${entity} with the same ${args.property} already exists`;
  }
}

type UniqueValidationConstraints<E> = [
  ObjectType<E> | EntitySchema<E> | string,
  (validationArguments: ValidationArguments) => FindOptionsWhere<E>,
];
interface IUniqueValidationArguments<E> extends ValidationArguments {
  constraints: UniqueValidationConstraints<E>;
}

export function Unique<E>(
  constraints: Partial<UniqueValidationConstraints<E>>,
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return function (object, propertyName: string | symbol) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName as string,
      options: validationOptions,
      constraints,
      validator: UniqueValidator,
    });
  };
}
