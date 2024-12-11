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
import { Role, Status } from '../types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
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

    if (user.role !== Role.vendor) {
      throw new UnauthorizedException(
        `Access denied. ${user.role} members should log in using Microsoft social login`,
      );
    }

    if (user.status === Status.inactive) {
      throw new UnauthorizedException(
        `User account inactive. Contact admin to activate account`,
      );
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
      throw new UnauthorizedException('User does not exist');
    }
    if (!(await this.otp.verify(dto.code, user.id))) {
      throw new UnauthorizedException('Invalid or expired OTP code');
    }

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
