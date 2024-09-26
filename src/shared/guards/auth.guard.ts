import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { isUUID } from 'class-validator';
import { Auth0Service } from 'src/user/services/auth0.service';
import { UserRepository } from 'src/user/repositories/user.repository';
import { Role } from 'src/user/types';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);
  constructor(
    private readonly reflector: Reflector,
    private jwtService: JwtService,
    private auth0Service: Auth0Service,
    private repository: UserRepository,
    private config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }
    try {
      let payload;
      try {
        payload = await this.jwtService.verifyAsync(token, {
          secret: this.config.get('auth.secret'),
        });
      } catch {
        payload = await this.auth0Service.verify(token);
      }

      if (!payload) {
        throw new UnauthorizedException('Token validation error');
      }

      const isValidUUID = isUUID(payload.sub);

      this.logger.debug(payload);

      const queryField = isValidUUID ? 'id' : 'email';
      const param = isValidUUID ? payload.sub : payload.email;
      const userExists = await this.repository.findOne({
        where: { [queryField]: param },
      });

      if (!userExists) {
        throw new NotFoundException(`User not found`);
      }
      request.user = userExists;

      this.logger.debug(userExists);

      return this.authorizeUser(request, context);
    } catch (err) {
      throw new HttpException(err.message, err.status);
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
