import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository, SelectQueryBuilder } from 'typeorm';

import { PageDto } from '../../../../common/dto/page.dto.ts';
import { LogSource } from '../../../../constants/log-source.ts';
import { AdminLogEntryEntity } from '../../admin-log-entry.entity.ts';
import { AdminLogEntryDto } from '../../dtos/admin-log-entry.dto.ts';
import type { AdminLogOptionsDto } from '../../dtos/admin-log-options.dto.ts';
import { AdminLogSourceCountsDto } from '../../dtos/admin-log-source-counts.dto.ts';
import { AdminLogsPageMetaDto } from '../../dtos/admin-logs-page-meta.dto.ts';
import { GetAdminLogsQuery } from './get-admin-logs.query.ts';

/** One row of the grouped `source -> count` aggregate. */
interface ISourceCountRow {
  source: LogSource;
  count: string;
}

@QueryHandler(GetAdminLogsQuery)
export class GetAdminLogsHandler
  implements IQueryHandler<GetAdminLogsQuery, PageDto<AdminLogEntryDto>>
{
  constructor(
    @InjectRepository(AdminLogEntryEntity)
    private readonly logRepository: Repository<AdminLogEntryEntity>,
  ) {}

  async execute(query: GetAdminLogsQuery): Promise<PageDto<AdminLogEntryDto>> {
    const { optionsDto } = query;

    // Page query: every filter (level, source, time window, free-text) applies.
    const listQb = this.logRepository.createQueryBuilder('log');
    this.applyCommonFilters(listQb, optionsDto);

    if (optionsDto.source) {
      listQb.andWhere('log.source = :source', { source: optionsDto.source });
    }

    listQb.orderBy('log.timestamp', optionsDto.order);

    /*
     * Counts query: shares the common filters but deliberately omits the
     * `source` filter so the breakdown stays meaningful — the FE can show how
     * many logs of each source exist within the level/time/text-filtered set
     * regardless of which single source tab is currently selected.
     */
    const countsQb = this.logRepository
      .createQueryBuilder('log')
      .select('log.source', 'source')
      .addSelect('COUNT(*)', 'count')
      .groupBy('log.source');
    this.applyCommonFilters(countsQb, optionsDto);

    const [[items, pageMetaDto], countRows] = await Promise.all([
      listQb.paginate(optionsDto),
      countsQb.getRawMany<ISourceCountRow>(),
    ]);

    const counts = this.buildCounts(countRows);

    const meta = AdminLogsPageMetaDto.fromPageOptionsWithCounts(
      optionsDto,
      pageMetaDto.itemCount,
      counts,
    );

    return PageDto.create({
      data: items.map((item) => item.toDto()),
      meta,
    });
  }

  /**
   * Applies the filters shared by both the page query and the counts query:
   * level, time window (`from`/`to` on the timestamp column), memory-point
   * correlation and free-text (`q`, case-insensitive on the message). `source`
   * is intentionally excluded — callers add it only where it belongs.
   */
  private applyCommonFilters(
    queryBuilder: SelectQueryBuilder<AdminLogEntryEntity>,
    optionsDto: AdminLogOptionsDto,
  ): void {
    if (optionsDto.level) {
      queryBuilder.andWhere('log.level = :level', { level: optionsDto.level });
    }

    /*
     * memoryPointId is a common filter (like level/from/to): when the admin
     * scopes the view to one point, the per-source counts must reflect that
     * same filtered set so the breakdown stays consistent with the list.
     */
    if (optionsDto.memoryPointId) {
      queryBuilder.andWhere('log.memoryPointId = :memoryPointId', {
        memoryPointId: optionsDto.memoryPointId,
      });
    }

    if (optionsDto.from) {
      queryBuilder.andWhere('log.timestamp >= :from', {
        from: optionsDto.from,
      });
    }

    if (optionsDto.to) {
      queryBuilder.andWhere('log.timestamp <= :to', { to: optionsDto.to });
    }

    if (optionsDto.q) {
      queryBuilder.andWhere('log.message ILIKE :q', {
        q: `%${optionsDto.q}%`,
      });
    }
  }

  /** Folds the grouped rows into a zero-filled per-source counts DTO. */
  private buildCounts(rows: ISourceCountRow[]): AdminLogSourceCountsDto {
    const tally: Record<LogSource, number> = {
      [LogSource.API]: 0,
      [LogSource.AR]: 0,
      [LogSource.DID]: 0,
      [LogSource.MAPS]: 0,
      [LogSource.AUTH]: 0,
    };

    for (const row of rows) {
      tally[row.source] = Number(row.count);
    }

    return AdminLogSourceCountsDto.create({
      api: tally[LogSource.API],
      ar: tally[LogSource.AR],
      did: tally[LogSource.DID],
      maps: tally[LogSource.MAPS],
      auth: tally[LogSource.AUTH],
    });
  }
}
