import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from 'src/user/services/auth.service';
import { AuthCreateDto } from 'src/user/dtos/auth-create.dto';
import { AuthVerifyDto } from '../dtos/auth-verify.dto';
import { Auth0Service } from '../services/auth0.service';
import { Role } from '../types';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly auth0Service: Auth0Service,
  ) {}

  @Post('login')
  create(@Body() createAuthDto: AuthCreateDto) {
    return this.authService.create(createAuthDto);
  }

  @Post('verify')
  verify(@Body() verifyAuthDto: AuthVerifyDto) {
    return this.authService.verify(verifyAuthDto);
  }

  @Post('otp/send')
  sendOtp(@Body() dto: AuthCreateDto) {
    return this.authService.sendOtp(dto.email);
  }

  @Post('check')
  async check() {
    return this.auth0Service.getAllRoles(Role.staff);
  }
}
