import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from 'src/user/user.service';
import { UserController } from 'src/user/controllers/user.controller';
import { User } from '@okta/okta-sdk-nodejs';
import { SharedModule } from 'src/shared/shared.module';
import { UserRepository } from './repositories/user.repository';
import { AuthService } from './auth.service';
import { AuthController } from './controllers/auth.controller';
import { PassportModule } from '@nestjs/passport';
import { OktaStrategy } from './strategies/okta.strategy';
import { OktaService } from './okta.service';

@Module({
  imports: [TypeOrmModule.forFeature([User]), SharedModule, PassportModule],
  controllers: [UserController, AuthController],
  providers: [
    UserService,
    UserRepository,
    AuthService,
    OktaStrategy,
    OktaService,
  ],
  exports: [OktaService, UserRepository],
})
export class UserModule {}
