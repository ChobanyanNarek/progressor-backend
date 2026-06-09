import { PageMetaDto } from '../../../common/dto/page-meta.dto.ts';
import type { PageOptionsDto } from '../../../common/dto/page-options.dto.ts';
import { ClassField } from '../../../decorators/field.decorators.ts';
import { AdminLogSourceCountsDto } from './admin-log-source-counts.dto.ts';

/**
 * Page meta envelope for the admin logs list. Extends the standard
 * `PageMetaDto` (page/take/itemCount/... stay identical) and adds the
 * per-source `counts` breakdown the FE renders alongside the table, so the
 * counts ride inline on `meta.counts` rather than via a second endpoint.
 */
export class AdminLogsPageMetaDto extends PageMetaDto {
  @ClassField(() => AdminLogSourceCountsDto)
  counts!: AdminLogSourceCountsDto;

  static fromPageOptionsWithCounts(
    pageOptionsDto: PageOptionsDto,
    itemCount: number,
    counts: AdminLogSourceCountsDto,
  ): AdminLogsPageMetaDto {
    const base = PageMetaDto.fromPageOptions(pageOptionsDto, itemCount);

    return AdminLogsPageMetaDto.create({
      page: base.page,
      take: base.take,
      itemCount: base.itemCount,
      pageCount: base.pageCount,
      hasPreviousPage: base.hasPreviousPage,
      hasNextPage: base.hasNextPage,
      counts,
    });
  }
}
