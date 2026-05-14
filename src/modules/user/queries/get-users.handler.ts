import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import type { PageDto } from '../../../common/dto/page.dto.ts';
import type { UserDto } from '../dtos/user.dto.ts';
import { UserEntity } from '../user.entity.ts';
import { GetUsersQuery } from './get-users.query.ts';

@QueryHandler(GetUsersQuery)
export class GetUsersHandler
  implements IQueryHandler<GetUsersQuery, PageDto<UserDto>>
{
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async execute(query: GetUsersQuery): Promise<PageDto<UserDto>> {
    const { pageOptionsDto } = query;
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (pageOptionsDto.q) {
      queryBuilder.searchByString(pageOptionsDto.q, ['firstName', 'email']);
    }

    const [items, pageMetaDto] = await queryBuilder.paginate(pageOptionsDto);

    // eslint-disable-next-line sonarjs/argument-type
    return items.toPageDto(pageMetaDto);
  }
}
