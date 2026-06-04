import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { UserNotFoundException } from '../../../../exceptions/user-not-found.exception.ts';
import type { UserDto } from '../../dtos/user.dto.ts';
import { UserEntity } from '../../user.entity.ts';
import { GetUserQuery } from './get-user.query.ts';

@QueryHandler(GetUserQuery)
export class GetUserHandler implements IQueryHandler<GetUserQuery, UserDto> {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async execute(query: GetUserQuery): Promise<UserDto> {
    const userEntity = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id = :userId', { userId: query.userId })
      .getOne();

    if (!userEntity) {
      throw new UserNotFoundException();
    }

    return userEntity.toDto();
  }
}
