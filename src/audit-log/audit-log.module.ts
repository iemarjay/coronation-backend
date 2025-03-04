import { forwardRef, Module } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { AuditLogController } from './audit-log.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from './entites/audit-log.entity';
import { AuditLogRepository } from './repositories/audit-log.repository';
import { SharedModule } from 'src/shared/shared.module';
import { UserModule } from 'src/user/user.module';
import { TeamModule } from 'src/team/team.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuditLog]),
    SharedModule,
    forwardRef(() => UserModule),
    forwardRef(() => TeamModule),
  ],
  controllers: [AuditLogController],
  providers: [AuditLogService, AuditLogRepository],
  exports: [AuditLogService],
})
export class AuditLogModule {}
