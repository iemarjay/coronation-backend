import { Injectable } from '@nestjs/common';
import { CacheService, TTL } from 'src/shared/cache.service';

@Injectable()
export class OtpService {
  constructor(private cache: CacheService) {}
  async generateFor(userId: string): Promise<string> {
    const code = Math.floor(10000 + Math.random() * 90000).toString();
    await this.cache.set(`otp:${code}`, userId, TTL.FIVE_MINUTES);
    await this.cache.set(`user_otp:${userId}`, code, TTL.FIVE_MINUTES);
    return code;
  }

  async verify(code: string, userId: string): Promise<boolean> {
    const cachedUserId = await this.cache.get<string>(`otp:${code}`);
    return cachedUserId === userId;
  }

  async invalidate(code: string, userId: string): Promise<void> {
    await this.cache.del(`otp:${code}`);
    await this.cache.del(`user_otp:${userId}`);
  }

  async getOtpByUserId(userId: string): Promise<string | null> {
    return await this.cache.get(`user_otp:${userId}`);
  }
}
