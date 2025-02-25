import { Controller, Get, Query } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { Authenticate } from 'src/shared/decorators/auth-user.decorator';
import { Role } from 'src/user/types';

@Controller('audit-log')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Authenticate(Role.staff, Role.admin)
  @Get('recent')
  async getRecentLogs(
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return await this.auditLogService.getRecentLogs({
      page,
      limit,
    });
  }
}
