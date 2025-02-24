import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  NotFoundException,
  PreconditionFailedException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Auth0Service } from 'src/user/services/auth0.service';
import { UserRepository } from 'src/user/repositories/user.repository';
import { Role, Status } from 'src/user/types';
import { OktaService } from 'src/user/services/okta.service';
import { isUUID } from 'class-validator';
import { UserService } from 'src/user/services/user.service';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly auth0Service: Auth0Service,
    private readonly oktaService: OktaService,
    private userRepository: UserRepository,
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
        type: 'jwt' | 'okta';
      }
      const payload: Payload = { data: null, type: null };
      try {
        payload.data = await this.jwtService.verifyAsync(token, {
          secret: this.config.get('auth.secret'),
        });
        payload.type = 'jwt';
      } catch {
        payload.data = await this.oktaService.verify(token);
        payload.type = 'okta';
      }

      if (!payload?.data) {
        throw new UnauthorizedException('Token validation error');
      }

      const isValidUUID = isUUID(payload.data.sub);

      const queryField = isValidUUID ? 'id' : 'email';
      const param = payload.data.sub;
      let userExists = await this.userRepository.findOne({
        where: { [queryField]: param },
      });

      if (!userExists && payload.type === 'okta') {
        await this.userService.createSuperUser({
          email: payload.data.sub,
          name: payload.data.name,
          role: Role.staff,
          isOwner: false,
        });
        throw new PreconditionFailedException(
          'Contact admin to complete registration',
        );
      }

      if (!userExists) {
        throw new NotFoundException(`Vendor not registered on portal`);
      }

      if (userExists.status === Status.inactive) {
        throw new UnauthorizedException(
          `User account inactive. Contact admin to activate account`,
        );
      }

      if (!userExists.team && userExists.role === Role.staff) {
        throw new PreconditionFailedException(
          'Contact admin to complete registration',
        );
      }

      if (payload.data.picture && !userExists.imageUrl) {
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
