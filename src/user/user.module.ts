import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from 'src/user/services/user.service';
import { UserController } from 'src/user/controllers/user.controller';
import { User } from '@okta/okta-sdk-nodejs';
import { SharedModule } from 'src/shared/shared.module';
import { UserRepository } from './repositories/user.repository';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { PassportModule } from '@nestjs/passport';
import { OktaStrategy } from './strategies/okta.strategy';
import { OktaService } from './services/okta.service';
import { JwtStrategy } from './strategies/auth0.strategy';
import { Auth0Service } from './services/auth0.service';
import { TeamModule } from 'src/team/team.module';
import { UserListener } from './listeners/user.listener';
import { Permission } from './entities/permission.entity';
import { PermissionRepository } from './repositories/permission.repository';
import { PermissionService } from './services/permission.service';
import { AssetModule } from 'src/asset/asset.module';
import { MicrosoftService } from './services/microsoft.service';
import { AuditLogModule } from 'src/audit-log/audit-log.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Permission]),
    SharedModule,
    PassportModule.register({
      defaultStrategy: 'okta',
    }),
    forwardRef(() => TeamModule),
    forwardRef(() => AssetModule),
    AuditLogModule,
  ],
  controllers: [UserController, AuthController],
  providers: [
    UserService,
    UserRepository,
    PermissionRepository,
    PermissionService,
    AuthService,
    UserListener,
    OktaStrategy,
    OktaService,
    Auth0Service,
    JwtStrategy,
    MicrosoftService,
  ],
  exports: [
    OktaService,
    UserRepository,
    PermissionRepository,
    Auth0Service,
    UserService,
    MicrosoftService,
  ],
})
export class UserModule {}
