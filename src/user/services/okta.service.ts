import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OtpService } from 'src/shared/otp.service';
import { UserRepository } from 'src/user/repositories/user.repository';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailService } from 'src/shared/mail.service';
import * as OktaJwtVerifier from '@okta/jwt-verifier';

@Injectable()
export class OktaService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
    private readonly emitter: EventEmitter2,
    private readonly otp: OtpService,
  ) {}

  async verify(token: string) {
    try {
      const oktaVerifier = new OktaJwtVerifier({
        issuer: this.config.get('okta.issuer'),
        clientId: this.config.get('okta.clientId'),
      });

      const jwt = await oktaVerifier.verifyAccessToken(
        token,
        this.config.get('okta.audience'),
      );
      return jwt.claims;
    } catch (error) {
      throw new UnauthorizedException('Invalid Token');
    }
  }
}
