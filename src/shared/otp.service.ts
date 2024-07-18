import { Injectable } from '@nestjs/common';
import { CacheService, TTL } from 'src/shared/cache.service';

@Injectable()
export class OtpService {
  constructor(private cache: CacheService) {}
  async generateFor(userId: string): Promise<string> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await this.cache.set(`otp:${code}`, userId, TTL.FIVE_MINUTES);
    return code;
  }

  async verify(code: string, userId: string): Promise<boolean> {
    const cachedUserId = await this.cache.get<string>(`otp:${code}`);
    return cachedUserId === userId;
  }

  async invalidate(code: string): Promise<void> {
    await this.cache.del(`otp:${code}`);
  }
}
