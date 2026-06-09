import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository, SelectQueryBuilder } from 'typeorm';

import { PageDto } from '../../../../common/dto/page.dto.ts';
import { escapeLikePattern } from '../../../../common/utils.ts';
import { AdminLogEntryEntity } from '../../admin-log-entry.entity.ts';
import type { AdminLogEntryDto } from '../../dtos/admin-log-entry.dto.ts';
import type { AdminLogOptionsDto } from '../../dtos/admin-log-options.dto.ts';
import { GetAdminLogsQuery } from './get-admin-logs.query.ts';

@QueryHandler(GetAdminLogsQuery)
export class GetAdminLogsHandler
  implements IQueryHandler<GetAdminLogsQuery, PageDto<AdminLogEntryDto>>
{
  constructor(
    @InjectRepository(AdminLogEntryEntity)
    private readonly adminLogEntryRepository: Repository<AdminLogEntryEntity>,
  ) {}

  async execute(query: GetAdminLogsQuery): Promise<PageDto<AdminLogEntryDto>> {
    const { optionsDto } = query;

    const queryBuilder = this.adminLogEntryRepository.createQueryBuilder('log');
    this.applyFilters(queryBuilder, optionsDto);
    queryBuilder.orderBy('log.timestamp', optionsDto.order);

    const [items, pageMetaDto] = await queryBuilder.paginate(optionsDto);

    return PageDto.create({
      data: items.map((item) => item.toDto()),
      meta: pageMetaDto,
    });
  }

  /**
   * Applies every list filter: level, source, time window (`from`/`to` on the
   * timestamp column), memory-point correlation and free-text (`q`,
   * case-insensitive on the message).
   */
  private applyFilters(
    queryBuilder: SelectQueryBuilder<AdminLogEntryEntity>,
    optionsDto: AdminLogOptionsDto,
  ): void {
    if (optionsDto.level) {
      queryBuilder.andWhere('log.level = :level', { level: optionsDto.level });
    }

    if (optionsDto.source) {
      queryBuilder.andWhere('log.source = :source', {
        source: optionsDto.source,
      });
    }

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
        q: `%${escapeLikePattern(optionsDto.q)}%`,
      });
    }
  }
}
