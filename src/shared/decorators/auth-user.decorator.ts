import {
  applyDecorators,
  createParamDecorator,
  ExecutionContext,
  Logger,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { Role } from 'src/user/types';
import { AuthGuard } from '../guards/auth.guard';

export const AuthUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const logger = new Logger(AuthUser.name);
    const request = ctx.switchToHttp().getRequest();
    logger.debug(request.user);
    return request.user;
  },
);

export const Authenticate = (...roles: Role[]) =>
  applyDecorators(SetMetadata('roles', roles), UseGuards(AuthGuard));
