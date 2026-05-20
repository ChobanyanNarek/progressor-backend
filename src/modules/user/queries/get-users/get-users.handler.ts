import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { PageDto } from '../../../../common/dto/page.dto.ts';
import { RoleType } from '../../../../constants/role-type.ts';
import { UserListDto } from '../../dtos/user-list.dto.ts';
import { UserEntity } from '../../user.entity.ts';
import { GetUsersQuery } from './get-users.query.ts';

@QueryHandler(GetUsersQuery)
export class GetUsersHandler
  implements IQueryHandler<GetUsersQuery, PageDto<UserListDto>>
{
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async execute(query: GetUsersQuery): Promise<PageDto<UserListDto>> {
    const { pageOptionsDto } = query;
    const role = pageOptionsDto.role ?? RoleType.CREATOR;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .where('role = :role', { role });

    if (pageOptionsDto.q) {
      queryBuilder.searchByString(pageOptionsDto.q, ['firstName', 'email']);
    }

    const [items, pageMetaDto] = await queryBuilder.paginate(pageOptionsDto);

    const userListDto = items.map((user) => UserListDto.create(user));

    // eslint-disable-next-line awesome-nest/no-dto-direct-instantiation
    return new PageDto(userListDto, pageMetaDto);
  }
}
