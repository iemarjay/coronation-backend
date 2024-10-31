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
import { Permission } from '../entities/permission.entity';
import { ActivateDeactvateUserDto } from '../dtos/activate-deactivate-user.dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(
    protected repository: UserRepository,
    protected teamRepository: TeamRepository,
    protected permissionRepository: PermissionRepository,
    private readonly event: EventEmitter2,
  ) {}

  async create(dto: CreateUserDto, modifier: User) {
    if (await this.repository.credentialsExists(dto)) {
      throw new BadRequestException('User email already exists');
    }

    const { email, firstName, role, teamId, permissions, status } = dto;

    if (role === Role.staff && !teamId) {
      throw new BadRequestException(
        'A staff must be associated with a valid department',
      );
    }

    let team = null;
    if (teamId) {
      team = await this.teamRepository.findOne({
        where: { id: teamId.trim() },
      });
      if (!team) {
        throw new BadRequestException('Department not found');
      }
    }

    let data: any = {
      role,
      email,
      firstName: firstName.trim(),
      team,
    };
    let lastName: string;

    if (dto.lastName) {
      data.lastName = lastName.trim();
    }
    let user = Object.assign(new User(), data);
    if (role === Role.vendor && teamId) {
      throw new BadRequestException('A vendor cannot be added to a department');
    }

    let userPermissions: Permission[] = [];
    if (role === Role.vendor && permissions && permissions.length > 0) {
      userPermissions = await this.permissionRepository.findBy({
        id: In(permissions),
      });
    } else if (role !== Role.vendor && !permissions) {
      userPermissions = await this.permissionRepository.find();
    } else if (role !== Role.vendor && permissions && permissions.length > 0) {
      userPermissions = await this.permissionRepository.findBy({
        id: In(permissions),
      });
    }

    user.permissions = userPermissions;
    user.lastModifiedBy = modifier;
    user.createdBy = modifier;
    if (status) {
      user.status = status;
    }

    user = await this.repository.save(user);

    this.event.emit(
      UserEvents.USER_CREATED,
      new UserCreatedEvent(
        instanceToPlain<Partial<User>>(user),
        UserCreatedEventRoute.FORM,
      ),
    );

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
      const userPermissions = await this.permissionRepository.find();
      user = await this.repository.save({
        firstName: given_name,
        lastName: family_name,
        email,
        role,
        imageUrl: picture,
        status: Status.active,
        permissions: userPermissions,
      });
      user.lastModifiedBy = user;
      user.createdBy = user;
      this.repository.save(user);
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
    team,
    date,
  }: {
    limit: number;
    page: number;
    role: Role;
    status: Status;
    search: string;
    team: string;
    date: string;
  }) {
    try {
      const data = await this.repository.getAllUsers({
        limit: limit ?? 10,
        page: page ?? 1,
        role,
        status,
        search,
        team,
        date,
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
    });
    if (!user) throw new NotFoundException('User not found');

    const { firstName, lastName, role, teamId, permissions } = dto;

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
    }

    let team = null;
    if (teamId && user.role !== Role.vendor) {
      team = await this.teamRepository.findOne({ where: { id: teamId } });
      if (!team) {
        throw new BadRequestException('Department not found');
      }
      user.team = team;
    }

    user.lastModifiedBy = modifier;

    return this.repository.save(user);
  }

  async activateDeactivate(
    id: string,
    dto: ActivateDeactvateUserDto,
    modifier: User,
  ) {
    const user = await this.repository.findOne({
      where: { id },
    });
    if (!user) throw new NotFoundException('User not found');

    user.status = dto.status;
    const result = await this.repository.save(user);
    return {
      success: true,
      message: `User ${dto.status === Status.active ? 'Activated' : 'Deactivated'}`,
      data: result,
    };
  }

  async deleteUser(id: string) {
    const user = await this.repository.findOne({
      where: { id },
    });
    if (!user) throw new NotFoundException('User not found');

    this.repository.remove(user);

    return {
      message: `user with email ${user.email} deleted`,
    };
  }

  async getAllTeamsAndUsers() {
    const result = await this.repository.getAllTeamsAndUsers();

    return {
      success: true,
      data: result,
    };
  }
}
