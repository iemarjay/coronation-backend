import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import Redis from 'ioredis';
import { CacheService } from 'src/shared/cache.service';
import { MailService } from 'src/shared/mail.service';
import { OtpService } from 'src/shared/otp.service';

@Module({
  imports: [],
  controllers: [],
  providers: [
    JwtService,
    OtpService,
    CacheService,
    MailService,
    {
      provide: 'REDIS_CLIENT',
      inject: [ConfigService],
      useFactory(config: ConfigService) {
        return new Redis(config.get('redis'));
      },
    },
  ],
  exports: [
    JwtService,
    OtpService,
    CacheService,
    MailService,
  ],
})
export class SharedModule {}
