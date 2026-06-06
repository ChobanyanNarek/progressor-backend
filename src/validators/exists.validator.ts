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
 * Async class-validator constraint backing the `@Exists` decorator: asserts that
 * a matching row exists for the given entity/condition. Registered by the
 * `Exists` factory below, so the symbol is referenced internally and must not be
 * marked `@deprecated` (that would flag its own factory as using a deprecated
 * symbol).
 */
@ValidatorConstraint({ name: 'exists', async: true })
export class ExistsValidator implements ValidatorConstraintInterface {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  public async validate<E>(
    _value: string,
    args: IExistsValidationArguments<E>,
  ): Promise<boolean> {
    const [entityClass, findCondition] = args.constraints;

    return (
      (await this.dataSource
        .getRepository(entityClass)
        .createQueryBuilder('entity')
        .setFindOptions({ where: findCondition(args) })
        .getCount()) > 0
    );
  }

  defaultMessage(args: ValidationArguments): string {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const [entityClass] = args.constraints;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
    const entity = entityClass.name ?? 'Entity';

    return `The selected ${args.property}  does not exist in ${entity} entity`;
  }
}

type ExistsValidationConstraints<E> = [
  ObjectType<E> | EntitySchema<E> | string,
  (validationArguments: ValidationArguments) => FindOptionsWhere<E>,
];
interface IExistsValidationArguments<E> extends ValidationArguments {
  constraints: ExistsValidationConstraints<E>;
}

export function Exists<E>(
  constraints: Partial<ExistsValidationConstraints<E>>,
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (object, propertyName: string | symbol) => {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName as string,
      options: validationOptions,
      constraints,
      validator: ExistsValidator,
    });
  };
}
