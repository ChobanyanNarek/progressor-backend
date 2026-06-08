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
      .where('role = :role', { role })
      .orderBy('user.createdAt', pageOptionsDto.order);

    if (pageOptionsDto.status) {
      queryBuilder.andWhere('user.status = :status', {
        status: pageOptionsDto.status,
      });
    }

    if (pageOptionsDto.q) {
      /*
       * Columns MUST be alias-qualified (`user.firstName`) so TypeORM rewrites
       * the property name to its snake_case column (`user.first_name`). Passing
       * bare `firstName` leaks raw into the SQL, Postgres lower-cases it to
       * `firstname`, the column does not exist and the query 500s.
       */
      queryBuilder.searchByString(pageOptionsDto.q, [
        'user.firstName',
        'user.email',
      ]);
    }

    const [items, pageMetaDto] = await queryBuilder.paginate(pageOptionsDto);

    /*
     * Map explicit fields only — never spread the raw entity, which would leak
     * `password` (and any future sensitive column) through plainToInstance.
     */
    const userListDto = items.map((user) =>
      UserListDto.create({
        id: user.id,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        status: user.status,
        avatar: user.avatar,
        lastLogin: user.lastLogin,
      }),
    );

    return PageDto.create({ data: userListDto, meta: pageMetaDto });
  }
}
