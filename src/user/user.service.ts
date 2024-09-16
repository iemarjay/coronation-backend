import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from 'src/user/dtos/create-user.dto';
import { UserRepository } from './repositories/user.repository';
import { AuthService } from './auth.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserCreatedEvent, UserEvents } from './user.event';
import { instanceToPlain } from 'class-transformer';
import { User } from './entities/user.entity';
import { Role, UserCreatedEventRoute } from './types';

@Injectable()
export class UserService {
  constructor(
    protected repository: UserRepository,
    private readonly auth: AuthService,
    private event: EventEmitter2,
  ) {}

  async create(dto: CreateUserDto) {
    if (await this.repository.credentialsExists(dto)) {
      throw new BadRequestException('User email already exists');
    }

    const user = await this.repository.save({
      ...dto,
      isAdmin: dto.role === Role.admin,
    });

    this.event.emit(
      UserEvents.USER_CREATED,
      new UserCreatedEvent(
        instanceToPlain<Partial<User>>(user),
        UserCreatedEventRoute.FORM,
      ),
    );

    return user;
  }
}
