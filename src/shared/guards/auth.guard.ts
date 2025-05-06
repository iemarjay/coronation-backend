import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  PreconditionFailedException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from 'src/user/repositories/user.repository';
import { Role, Status } from 'src/user/types';
import { UserService } from 'src/user/services/user.service';
import { TeamRepository } from 'src/team/repositories/team.repository';
import { MicrosoftService } from 'src/user/services/microsoft.service';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly microsoftService: MicrosoftService,
    private userRepository: UserRepository,
    private teamRepository: TeamRepository,
    private userService: UserService,
    private config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }
    try {
      interface Payload {
        data: any;
        type: 'jwt' | 'microsoft';
      }
      const payload: Payload = { data: null, type: null };
      try {
        payload.data = await this.jwtService.verifyAsync(token, {
          secret: this.config.get('auth.secret'),
        });
        payload.type = 'jwt';
      } catch {
        payload.data = await this.microsoftService.verify(token);
        payload.type = 'microsoft';
      }

      console.log(payload);
      console.log(payload.data.prov_data);

      if (!payload?.data) {
        throw new UnauthorizedException('Token validation error');
      }

      const queryField = payload.type === 'microsoft' ? 'email' : 'id';
      const param =
        payload.type === 'microsoft' ? payload.data.email : payload.data.sub;
      let userExists = await this.userRepository.findOne({
        where: { [queryField]: param },
      });

      if (!userExists && payload.type === 'microsoft') {
        if (!payload.data.department) {
          const userDomain = payload.data.email.split('@')[1];
          const adminEmails = this.config.get('adminEmails');
          const adminEmail =
            adminEmails[userDomain] || adminEmails['coronationgroup.com']; // fallback to coronation group admin

          throw new PreconditionFailedException({
            message: {
              text: 'Contact admin to complete registration',
              email: adminEmail,
            },
          });
        }

        const team = await this.teamRepository.findByNameOrCreate(
          payload.data.department,
        );
        const user = await this.userService.createSuperUser({
          email: payload.data.email,
          name: payload.data.name || payload.data.email,
          role: Role.staff,
          isOwner: false,
          team,
        });

        userExists = await this.userRepository.findOne({
          where: { id: user.id },
        });
      } else if (!userExists && payload.type === 'jwt') {
        throw new UnauthorizedException(`Invalid or expired token`);
      }

      if (userExists && userExists?.status === Status.inactive.toLowerCase()) {
        throw new UnauthorizedException(
          `User account inactive. Contact admin to activate account`,
        );
      }

      if (userExists && !userExists?.team && userExists?.role === Role.staff) {
        const team = await this.teamRepository.findByNameOrCreate(
          payload.data.department,
        );
        userExists.team = team;
        this.userRepository.save(userExists);
      }

      if (payload.data.picture && userExists && !userExists?.imageUrl) {
        userExists.imageUrl = payload.data.picture;
        userExists = await this.userRepository.save(userExists);
      }
      request.user = userExists;

      return this.authorizeUser(request, context);
    } catch (err) {
      throw err;
    }
  }

  private async authorizeUser(
    request: any,
    context: ExecutionContext,
  ): Promise<boolean> {
    const requiredRoles = this.getMetadata<Role[]>('roles', context);
    const userRole = request.user.role;

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    return requiredRoles.includes(userRole);
  }

  private getMetadata<T>(key: string, context: ExecutionContext): T {
    return this.reflector.getAllAndOverride<T>(key, [
      context.getHandler(),
      context.getClass(),
    ]);
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers?.['authorization']?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
