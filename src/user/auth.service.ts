import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OtpService } from 'src/shared/otp.service';
import { UserRepository } from 'src/user/repositories/user.repository';
import { AuthCreateDto } from 'src/user/dtos/auth-create.dto';
import { User } from '../user/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailService } from 'src/shared/mail.service';
import { AuthVerifyDto } from './dtos/auth-verify.dto';
import { instanceToPlain } from 'class-transformer';
import { Role, UserCreatedEventRoute } from './types';
import { UserCreatedEvent, UserEvents } from './user.event';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
    private readonly emitter: EventEmitter2,
    private readonly otp: OtpService,
  ) {}
  async create(dto: AuthCreateDto) {
    let user: User;
    try {
      user = await this.userRepository.findOneByOrFail({
        email: dto.email,
      });
    } catch (error) {
      throw new UnauthorizedException('User does not exist');
    }

    this.mail.sendUserLoginOtp(user, await this.otp.generateFor(user.id));
    return {
      success: true,
      message: 'Complete login with OTP sent to email',
    };
  }

  async verify(
    dto: AuthVerifyDto,
  ): Promise<{ data: Partial<User>; access_token: string }> {
    let user: User;
    try {
      user = await this.userRepository.findOneByOrFail({
        email: dto.email,
      });
    } catch (error) {
      throw new UnauthorizedException('User does not exist');
    }
    if (!(await this.otp.verify(dto.code, user.id))) {
      throw new UnauthorizedException('Invalid or expired OTP code');
    }
    return {
      data: instanceToPlain<Partial<User>>(user),
      access_token: await this.generateAccessToken(user.id),
    };
  }

  async generateAccessToken(sub: string) {
    return await this.jwtService.signAsync(
      {
        sub: sub,
      },
      {
        secret: this.config.get('auth.secret'),
      },
    );
  }

  async fromOkta(dto: { first_name: string; last_name: string; sub: string }) {
    let user: User;
    const { first_name, last_name, sub } = dto;
    try {
      user = await this.userRepository.findBAdminByEmailOrFail(sub);
    } catch {
      user = await this.userRepository.save({
        firstName: first_name,
        lastName: last_name,
        email: sub,
        role: Role.staff,
      });
      this.emitter.emit(
        UserEvents.USER_CREATED,
        new UserCreatedEvent(user, UserCreatedEventRoute.OKTA),
      );
    }
    return user;
  }
}
