import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
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

  @Post('check')
  async check() {
    return this.auth0Service.getAllRoles(Role.staff);
  }

  @Get('sign-in')
  signIn(@Req() req: any, @Res() res: any) {
    const code = req.query.code;
    const state = req.query.state;
    res.redirect(
      `https://brandportal-test-bscka6gwbug0hmck.westeurope-01.azurewebsites.net/sign-in?code=${code}&state=${state}`,
    );
  }
}
