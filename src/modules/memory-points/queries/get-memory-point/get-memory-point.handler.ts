import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { MemoryPointStatus } from '../../../../constants/memory-point-status.ts';
import { RoleType } from '../../../../constants/role-type.ts';
import type { MemoryPointDto } from '../../dtos/memory-point.dto.ts';
import { MemoryPointEntity } from '../../entities/memory-point.entity.ts';
import { MemoryPointNotFoundException } from '../../exceptions/memory-point-not-found.exception.ts';
import { GetMemoryPointQuery } from './get-memory-point.query.ts';

@QueryHandler(GetMemoryPointQuery)
export class GetMemoryPointHandler
  implements IQueryHandler<GetMemoryPointQuery, MemoryPointDto>
{
  constructor(
    @InjectRepository(MemoryPointEntity)
    private readonly memoryPointRepository: Repository<MemoryPointEntity>,
  ) {}

  async execute(query: GetMemoryPointQuery): Promise<MemoryPointDto> {
    const { memoryPointId, userId, role } = query;

    const queryBuilder = this.memoryPointRepository
      .createQueryBuilder('mp')
      .leftJoinAndSelect('mp.memoryPointDetails', 'details')
      .leftJoinAndSelect('mp.user', 'user')
      .where('mp.id = :id', { id: memoryPointId });

    if (userId) {
      if (role === RoleType.CREATOR) {
        queryBuilder.andWhere('mp.userId = :userId', {
          userId,
        });
      }
    } else {
      queryBuilder.andWhere('mp.status = :status', {
        status: MemoryPointStatus.APPROVED,
      });
    }

    const memoryPointEntity = await queryBuilder.getOne();

    if (!memoryPointEntity) {
      throw new MemoryPointNotFoundException();
    }

    return memoryPointEntity.toDto({
      includeSourceUrls: role === RoleType.ADMIN,
    });
  }
}
