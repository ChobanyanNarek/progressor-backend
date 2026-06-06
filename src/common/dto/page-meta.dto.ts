import {
  BooleanField,
  NumberField,
} from '../../decorators/field.decorators.ts';
import { BaseDto } from './base.dto.ts';
import type { PageOptionsDto } from './page-options.dto.ts';

export class PageMetaDto extends BaseDto {
  @NumberField()
  readonly page!: number;

  @NumberField()
  readonly take!: number;

  @NumberField()
  readonly itemCount!: number;

  @NumberField()
  readonly pageCount!: number;

  @BooleanField()
  readonly hasPreviousPage!: boolean;

  @BooleanField()
  readonly hasNextPage!: boolean;

  static fromPageOptions(
    pageOptionsDto: PageOptionsDto,
    itemCount: number,
  ): PageMetaDto {
    const page = pageOptionsDto.page;
    const take = pageOptionsDto.take;
    const pageCount = Math.ceil(itemCount / take);

    return PageMetaDto.create({
      page,
      take,
      itemCount,
      pageCount,
      hasPreviousPage: page > 1,
      hasNextPage: page < pageCount,
    });
  }
}
