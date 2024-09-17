import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { isUUID } from 'class-validator';
import { OktaService } from 'src/user/okta.service';
import { UserRepository } from 'src/user/repositories/user.repository';
import { Role } from 'src/user/types';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private jwtService: JwtService,
    private oktaService: OktaService,
    private repository: UserRepository,
    private config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      let payload;
      try {
        payload = await this.jwtService.verifyAsync(token, {
          secret: this.config.get('auth.secret'),
        });
      } catch {
        payload = await this.oktaService.verify(token);
      }

      if (!payload) {
        throw new UnauthorizedException();
      }

      const isEmail = payload.sub.includes('@');
      const isValidUUID = isUUID(payload.sub);

      if (!isEmail && !isValidUUID) {
        throw new UnauthorizedException('Invalid identifier in token');
      }

      const queryField = isEmail ? 'email' : 'id';
      request['user'] = await this.repository.findOne({
        where: { [queryField]: payload.sub },
      });
      return this.authorizeUser(request, context);
    } catch (err) {
      throw new UnauthorizedException('Token validation error', err);
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
