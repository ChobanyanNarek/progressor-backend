import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { FindOptionsWhere, Repository } from 'typeorm';

import type { PageDto } from '../../common/dto/page.dto.ts';
import { CreateUserCommand } from './commands/create-user/create-user.command.ts';
import { UpdateUserCommand } from './commands/update-user/update-user.command.ts';
import type { CreateUserDto } from './dtos/create-user.dto.ts';
import { CreateUserResultDto } from './dtos/create-user-result.dto.ts';
import type { UpdateUserDto } from './dtos/update-user.dto.ts';
import type { UserDto } from './dtos/user.dto.ts';
import type { UserListDto } from './dtos/user-list.dto.ts';
import type { UsersPageOptionsDto } from './dtos/users-page-options.dto.ts';
import { GetUserQuery } from './queries/get-user/get-user.query.ts';
import { GetUsersQuery } from './queries/get-users/get-users.query.ts';
import { UserEntity } from './user.entity.ts';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  findOne(findData: FindOptionsWhere<UserEntity>): Promise<UserEntity | null> {
    // eslint-disable-next-line awesome-nest/no-typeorm-finder-methods
    return this.userRepository.findOneBy(findData);
  }

  create(createUserDto: CreateUserDto): Promise<CreateUserResultDto> {
    return this.commandBus.execute<CreateUserCommand>(
      new CreateUserCommand(createUserDto),
    );
  }

  getUsers(pageOptionsDto: UsersPageOptionsDto): Promise<PageDto<UserListDto>> {
    return this.queryBus.execute<GetUsersQuery, PageDto<UserListDto>>(
      new GetUsersQuery(pageOptionsDto),
    );
  }

  getUser(userId: Uuid): Promise<UserDto> {
    return this.queryBus.execute<GetUserQuery, UserDto>(
      new GetUserQuery(userId),
    );
  }

  update(userId: Uuid, updateUserDto: UpdateUserDto): Promise<void> {
    return this.commandBus.execute<UpdateUserCommand>(
      new UpdateUserCommand(userId, updateUserDto),
    );
  }
}
