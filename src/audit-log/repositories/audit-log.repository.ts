import { Injectable } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { AuditLog } from '../entites/audit-log.entity';

@Injectable()
export class AuditLogRepository extends Repository<AuditLog> {
  constructor(datasource: DataSource) {
    super(AuditLog, datasource.createEntityManager());
  }

  async recentLogs(filter: { limit: number; page: number }) {
    const query = this.createQueryBuilder('auditLog');

    query
      .take(filter.limit)
      .skip(filter.limit * ((filter.page ?? 1) - 1))
      .orderBy('auditLog.createdAt', 'DESC')
      .leftJoinAndSelect('auditLog.asset', 'asset')
      .leftJoinAndSelect('auditLog.user', 'user');

    const [logs, totalCount] = await query.getManyAndCount();

    return {
      currentPage: filter.page,
      pageSize: filter.limit,
      totalCount,
      totalPages: Math.ceil(totalCount / filter.limit),
      logs,
    };
  }
}
