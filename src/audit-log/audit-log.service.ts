import { Injectable } from '@nestjs/common';
import { AuditLogRepository } from './repositories/audit-log.repository';
import { Method } from './entites/audit-log.entity';
import { User } from 'src/user/entities/user.entity';
import { OnEvent } from '@nestjs/event-emitter';
import { UserEvents } from 'src/user/constants/user-events';

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

  async logEmailLogin(user: User): Promise<void> {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 1);
    await this.auditLogRepository.save({
      method: Method.login_email,
      user,
      loginMethod: 'email_otp',
      createdAt: currentDate,
    });
  }

  async logMicrosoftLogin(user: User): Promise<void> {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 1);
    await this.auditLogRepository.save({
      method: Method.login_microsoft,
      user,
      loginMethod: 'microsoft_sso',
      createdAt: currentDate,
    });
  }

  async logLogout(user: User): Promise<void> {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 1);
    await this.auditLogRepository.save({
      method: Method.logout,
      user,
      createdAt: currentDate,
    });
  }

  async logFailedLogin(email: string, reason: string): Promise<void> {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 1);
    await this.auditLogRepository.save({
      method: Method.login_failed,
      user: { email } as User,
      failureReason: reason,
      createdAt: currentDate,
    });
  }

  // Event listeners
  @OnEvent(UserEvents.LOGIN_EMAIL)
  async handleEmailLogin(payload: { user: User }) {
    await this.logEmailLogin(payload.user);
  }

  @OnEvent(UserEvents.LOGIN_MICROSOFT)
  async handleMicrosoftLogin(payload: { user: User }) {
    await this.logMicrosoftLogin(payload.user);
  }

  @OnEvent(UserEvents.LOGOUT)
  async handleLogout(payload: { user: User }) {
    await this.logLogout(payload.user);
  }

  @OnEvent(UserEvents.LOGIN_FAILED)
  async handleFailedLogin(payload: { email: string; reason: string }) {
    await this.logFailedLogin(payload.email, payload.reason);
  }

  async getRecentLogs({ limit, page }: { limit: number; page: number }) {
    const logs = await this.auditLogRepository.recentLogs({
      limit: limit ?? 10,
      page: page ?? 1,
    });

    return logs;
  }
}
