import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from 'src/user/services/auth.service';
import { AuthCreateDto } from 'src/user/dtos/auth-create.dto';
import { AuthVerifyDto } from '../dtos/auth-verify.dto';
import { Auth0Service } from '../services/auth0.service';
import { Role } from '../types';
import { AuthGuard } from 'src/shared/guards/auth.guard';
import { AuthUser } from 'src/shared/decorators/auth-user.decorator';
import { User } from '../entities/user.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserEvents } from '../constants/user-events';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly auth0Service: Auth0Service,
    private readonly eventEmitter: EventEmitter2,
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

  @Post('logout')
  @UseGuards(AuthGuard)
  async logout(@AuthUser() user: User) {
    // Emit logout event
    this.eventEmitter.emit(UserEvents.LOGOUT, { user });
    
    return {
      success: true,
      message: 'Logged out successfully',
    };
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
