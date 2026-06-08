import { ApiProperty } from '@nestjs/swagger';

import { ClassField } from '../../decorators/field.decorators.ts';
import { BaseDto, type Plain } from './base.dto.ts';
import { PageMetaDto } from './page-meta.dto.ts';

export class PageDto<T> extends BaseDto {
  @ApiProperty({ isArray: true })
  readonly data!: T[];

  @ClassField(() => PageMetaDto)
  readonly meta!: PageMetaDto;

  constructor(data: T[], meta: PageMetaDto) {
    super();
    this.data = data;
    this.meta = meta;
  }

  /**
   * Overrides `BaseDto.create` with the identical static signature so the
   * static side stays assignable to the base (no TS2417). Unlike the base
   * factory it preserves the exact `data`/`meta` references instead of running
   * `plainToInstance`, which callers and tests depend on. Hosting the `new`
   * here also satisfies `no-dto-direct-instantiation`, which exempts a `new`
   * sitting inside the class's own static `create`.
   */
  static override create<TInstance extends BaseDto>(
    this: new (...args: unknown[]) => TInstance,
    data: Plain<TInstance>,
  ): TInstance;

  static override create<E>(data: { data: E[]; meta: PageMetaDto }): PageDto<E>;

  static override create(data: {
    data: unknown[];
    meta: PageMetaDto;
  }): PageDto<unknown> {
    return new PageDto(data.data, data.meta);
  }
}
