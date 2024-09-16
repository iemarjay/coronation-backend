import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from 'src/user/auth.service';
import { AuthCreateDto } from 'src/user/dtos/auth-create.dto';
import { AuthVerifyDto } from '../dtos/auth-verify.dto';
import { AuthGuard as OktaAuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  create(@Body() createAuthDto: AuthCreateDto) {
    return this.authService.create(createAuthDto);
  }

  @Post('verify')
  verify(@Body() verifyAuthDto: AuthVerifyDto) {
    return this.authService.verify(verifyAuthDto);
  }

  @Post('okta')
  @UseGuards(OktaAuthGuard('okta'))
  async oktaLogin(@Req() req) {
    return this.authService.fromOkta(req.user);
  }
}
