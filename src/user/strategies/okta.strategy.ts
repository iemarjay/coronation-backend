import { HttpException, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-http-bearer';
import { ConfigService } from '@nestjs/config';
import { OktaService } from 'src/user/services/okta.service';

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
      return user;
    } catch (error) {
      done(error, 'Invalid Token');
    }
  }
}
