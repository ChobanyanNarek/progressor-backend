import {
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { LanguageCode } from '../constants/language-code.ts';
import type {
  AbstractDto,
  AbstractTranslationDto,
} from './dto/abstract.dto.ts';

/**
 * Constructor shape stored on the prototype by the `@UseDto` decorator.
 * Typing it removes the `any` the raw prototype lookup would otherwise
 * introduce, and keeps the `DTO`/`O` type parameters load-bearing. The entity
 * parameter is the (non-generic) base type so that a concrete
 * `AbstractEntity<SpecificDto>` stays assignable to `AbstractEntity` — DTO
 * constructors accept the base entity, mirroring `AbstractDto`'s constructor.
 */
type DtoConstructor<DTO extends AbstractDto, O> = new (
  entity: AbstractEntity,
  options?: O,
) => DTO;

/**
 * Abstract Entity
 * @author Narek Hakobyan <narek.hakobyan.07@gmail.com>
 *
 * @description This class is an abstract class for all entities.
 * It's experimental and recommended using it only in microservice architecture,
 * otherwise just delete and use your own entity.
 */
export abstract class AbstractEntity<
  DTO extends AbstractDto = AbstractDto,
  O = never,
> {
  @PrimaryGeneratedColumn('uuid')
  id!: Uuid;

  @CreateDateColumn({
    type: 'timestamp',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp',
  })
  updatedAt!: Date;

  translations?: AbstractTranslationEntity[];

  /**
   * DTO constructor injected on the prototype by `@UseDto`. Declaring it here
   * (rather than reading an untyped prototype) keeps both `DTO` and `O` used in
   * the class signature and gives `toDto` a fully typed construction call.
   */
  declare protected readonly dtoClass?: DtoConstructor<DTO, O>;

  toDto(options?: O): DTO {
    if (!this.dtoClass) {
      throw new Error(
        `You need to use @UseDto on class (${this.constructor.name}) be able to call toDto function`,
      );
    }

    return new this.dtoClass(this, options);
  }
}

export class AbstractTranslationEntity<
  DTO extends AbstractTranslationDto = AbstractTranslationDto,
  O = never,
> extends AbstractEntity<DTO, O> {
  @Column({ type: 'enum', enum: LanguageCode })
  languageCode!: LanguageCode;
}
