import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from 'src/user/dtos/create-user.dto';
import { UserRepository } from '../repositories/user.repository';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserCreatedEvent, UserEvents } from '../user.event';
import { instanceToPlain } from 'class-transformer';
import { User } from '../entities/user.entity';
import { Role, Status, UserCreatedEventRoute } from '../types';
import { TeamRepository } from 'src/team/repositories/team.repository';
import { PermissionRepository } from '../repositories/permission.repository';
import { In } from 'typeorm';
import { UpdateUserDto } from '../dtos/update-user.dto';

@Injectable()
export class UserService {
  private logger = new Logger(UserService.name);
  constructor(
    protected repository: UserRepository,
    protected teamRepository: TeamRepository,
    protected permissionRepository: PermissionRepository,
    private event: EventEmitter2,
  ) {}

  async create(dto: CreateUserDto, modifier: User) {
    if (await this.repository.credentialsExists(dto)) {
      throw new BadRequestException('User email already exists');
    }

    const { email, firstName, lastName, role, teamId, permissions } = dto;

    if (role === Role.staff && !teamId) {
      throw new BadRequestException(
        'A staff member must be associated with a valid team',
      );
    }

    let team = null;
    if (teamId) {
      team = await this.teamRepository.findOne({ where: { id: teamId } });
      if (!team) {
        throw new BadRequestException('Team not found');
      }
    }
    let user = Object.assign(new User(), {
      role,
      email,
      firstName,
      lastName,
      team,
      isAdmin: dto.role === Role.admin,
    });
    if (role === Role.vendor && permissions) {
      const selectedPermissions = await this.permissionRepository.findBy({
        id: In(permissions),
      });
      user.permissions = selectedPermissions;
    } else {
      const allPermissions = await this.permissionRepository.find();
      user.permissions = allPermissions;
    }
    user.lastModifiedBy = modifier;

    user = await this.repository.save(user);

    if (role !== Role.vendor) {
      this.event.emit(
        UserEvents.USER_CREATED,
        new UserCreatedEvent(
          instanceToPlain<Partial<User>>(user),
          UserCreatedEventRoute.FORM,
        ),
      );
    }

    return user;
  }

  async createSuperUser(dto: {
    given_name: string;
    family_name: string;
    email: string;
    picture: string;
    role: Role;
    isOwner: boolean;
  }) {
    let user: User;
    const { given_name, family_name, email, role, isOwner, picture } = dto;

    if (!isOwner) {
      return new UnauthorizedException('Unathorized user access');
    }
    try {
      user = await this.repository.findBAdminByEmailOrFail(email);
    } catch {
      user = await this.repository.save({
        firstName: given_name,
        lastName: family_name,
        email,
        role,
        isAdmin: true,
        imageUrl: picture,
      });
      this.event.emit(
        UserEvents.USER_CREATED,
        new UserCreatedEvent(user, UserCreatedEventRoute.OKTA),
      );
    }
    return user;
  }

  async getAllUsers({
    limit,
    page,
    role,
    status,
    search,
  }: {
    limit: number;
    page: number;
    role: Role;
    status: Status;
    search: string;
  }) {
    try {
      const data = await this.repository.getAllUsers({
        limit: limit ?? 10,
        page: page ?? 1,
        role,
        status,
        search,
      });

      return data;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error);
    }
  }

  async updateUser(id: string, dto: UpdateUserDto, modifier: User) {
    const user = await this.repository.findOne({
      where: { id },
      relations: ['permissions'],
    });
    if (!user) throw new NotFoundException('User not found');

    const { firstName, lastName, role, teamId, permissions, status } = dto;

    if (permissions) {
      const selectedPermissions = await this.permissionRepository.findBy({
        id: In(permissions),
      });

      user.permissions = selectedPermissions;
    }

    if (firstName) {
      user.firstName = firstName;
    }

    if (lastName) {
      user.lastName = lastName;
    }

    if (role) {
      user.role = role;
      user.isAdmin = role === Role.admin;
    }

    if (status) {
      user.status = status;
    }

    let team = null;
    if (teamId && user.role !== Role.vendor) {
      team = await this.teamRepository.findOne({ where: { id: teamId } });
      if (!team) {
        throw new BadRequestException('Team not found');
      }
      user.team = team;
    }

    user.lastModifiedBy = modifier;

    return this.repository.save(user);
  }
}
