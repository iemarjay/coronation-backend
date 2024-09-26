import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';
import { Role } from '../types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience: configService.get<string>('auth0.audience'),
      issuer: configService.get<string>('auth0.issuer'),
      algorithms: ['RS256'],
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${configService.get<string>('auth0.issuer')}.well-known/jwks.json`,
      }),
    });
  }

  async validate(payload: any) {
    const viableRoles = [Role.admin, Role.staff];
    const userRoles =
      payload[`${this.configService.get<string>('auth0.audience')}roles`];
    const role = userRoles.find((role) => viableRoles.includes(role));

    let isOwner = false;
    if (userRoles.includes(Role.owner)) {
      isOwner = true;
    }

    this.logger.debug(payload);

    return {
      email: payload.email,
      given_name: payload.given_name,
      family_name: payload.family_name,
      picture: payload.picture,
      role,
      isOwner,
    };
  }
}
