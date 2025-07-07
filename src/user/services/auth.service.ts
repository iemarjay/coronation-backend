import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { OtpService } from 'src/shared/otp.service';
import { UserRepository } from 'src/user/repositories/user.repository';
import { AuthCreateDto } from 'src/user/dtos/auth-create.dto';
import { User } from '../entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailService } from 'src/shared/mail.service';
import { AuthVerifyDto } from '../dtos/auth-verify.dto';
import { instanceToPlain } from 'class-transformer';
import { Status } from '../types';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserService } from './user.service';
import { UserEvents } from '../constants/user-events';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
    private readonly otp: OtpService,
    private readonly eventEmitter: EventEmitter2,
    private readonly userService: UserService,
  ) {}
  async create(dto: AuthCreateDto) {
    let user: User;
    try {
      user = await this.userRepository.findOneByOrFail({
        email: dto.email,
      });
    } catch (error) {
      let message = 'User does not exist';
      if (this.config.get('domains').includes(dto.email.split('@')[1])) {
        message = 'Please use Microsoft for your first login.';
      }
      // Emit failed login event
      this.eventEmitter.emit(UserEvents.LOGIN_FAILED, { email: dto.email, reason: message });
      throw new UnauthorizedException(message);
    }

    if (user.status === Status.inactive) {
      const message = `User account inactive. Contact admin to activate account`;
      // Emit failed login event
      this.eventEmitter.emit(UserEvents.LOGIN_FAILED, { email: dto.email, reason: message });
      throw new UnauthorizedException(message);
    }
    const code = await this.otp.getOtpByUserId(user.id);
    if (code) {
      await this.otp.invalidate(code, user.id);
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
      // Emit failed login event
      this.eventEmitter.emit(UserEvents.LOGIN_FAILED, { email: dto.email, reason: 'User does not exist' });
      throw new UnauthorizedException('User does not exist');
    }

    if (user.status === Status.inactive) {
      const message = `User account inactive. Contact admin to activate account`;
      // Emit failed login event
      this.eventEmitter.emit(UserEvents.LOGIN_FAILED, { email: dto.email, reason: message });
      throw new UnauthorizedException(message);
    }
    if (!(await this.otp.verify(dto.code, user.id))) {
      // Emit failed login event
      this.eventEmitter.emit(UserEvents.LOGIN_FAILED, { email: dto.email, reason: 'Invalid or expired OTP code' });
      throw new UnauthorizedException('Invalid or expired OTP code');
    }

    // Emit successful email login event
    this.eventEmitter.emit(UserEvents.LOGIN_EMAIL, { user });
    
    // Update last login time and count
    await this.userService.updateLastLogin(user.id);

    this.otp.invalidate(dto.code, user.id).catch((error) => {
      this.logger.error(error);
    });
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
}
