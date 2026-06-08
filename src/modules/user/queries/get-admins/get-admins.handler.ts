import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { RoleType } from '../../../../constants/role-type.ts';
import type { UserDto } from '../../dtos/user.dto.ts';
import { UserEntity } from '../../user.entity.ts';
import { GetAdminsQuery } from './get-admins.query.ts';

@QueryHandler(GetAdminsQuery)
export class GetAdminsHandler
  implements IQueryHandler<GetAdminsQuery, UserDto[]>
{
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async execute(): Promise<UserDto[]> {
    const admins = await this.userRepository
      .createQueryBuilder('user')
      .where('user.role = :role', { role: RoleType.ADMIN })
      .orderBy('user.createdAt', 'ASC')
      .getMany();

    return admins.toDtos();
  }
}
