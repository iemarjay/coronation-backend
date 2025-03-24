import { Injectable } from '@nestjs/common';
import { AuditLogRepository } from './repositories/audit-log.repository';
import { Method } from './entites/audit-log.entity';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class AuditLogService {
  constructor(private readonly auditLogRepository: AuditLogRepository) {}

  async logAction(method: Method, user: User, asset: string): Promise<void> {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 1);
    await this.auditLogRepository.save({
      method,
      user,
      asset: {
        id: asset,
      },
      createdAt: currentDate,
    });
    return;
  }

  async getRecentLogs({ limit, page }: { limit: number; page: number }) {
    const logs = await this.auditLogRepository.recentLogs({
      limit: limit ?? 10,
      page: page ?? 1,
    });

    return logs;
  }
}
