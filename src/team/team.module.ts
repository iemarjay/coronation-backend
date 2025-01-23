import { forwardRef, Module } from '@nestjs/common';
import { TeamService } from './team.service';
import { TeamController } from './team.controller';
import { SharedModule } from 'src/shared/shared.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Team } from './entities/team.entity';
import { TeamRepository } from './repositories/team.repository';
import { UserModule } from 'src/user/user.module';
import { AssetModule } from 'src/asset/asset.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Team]),
    SharedModule,
    forwardRef(() => UserModule),
    forwardRef(() => AssetModule),
  ],
  controllers: [TeamController],
  providers: [TeamService, TeamRepository],
  exports: [TeamRepository],
})
export class TeamModule {}
