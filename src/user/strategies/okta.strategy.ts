import { HttpException, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-http-bearer';
import { ConfigService } from '@nestjs/config';
import { OktaService } from 'src/user/services/okta.service';
import { Role } from '../types';

@Injectable()
export class OktaStrategy extends PassportStrategy(Strategy, 'okta') {
  constructor(
    private readonly okta: OktaService,
    private readonly config: ConfigService,
  ) {
    super();
  }

  async validate(
    token: string,
    done: (error: HttpException, value: boolean | string) => any,
  ) {
    try {
      const user = await this.okta.verify(token);
      const viableRoles = [Role.admin, Role.staff] as string[];
      const userRoles = user.Groups as string[];

      const role = userRoles.find((role) =>
        viableRoles.includes(role.toLowerCase()),
      );

      let isOwner = false;
      const val = Role.owner.charAt(0).toUpperCase() + Role.owner.slice(1);
      if (userRoles.includes(val)) {
        isOwner = true;
      }
      return {
        email: user.sub,
        name: user.name,
        role,
        isOwner,
      };
    } catch (error) {
      done(error, 'Invalid Token');
    }
  }
}
