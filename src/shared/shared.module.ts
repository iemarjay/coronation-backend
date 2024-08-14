import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import Redis from 'ioredis';
import { CacheService } from 'src/shared/cache.service';
import { MailService } from 'src/shared/mail.service';
import { OtpService } from 'src/shared/otp.service';
import { StorageService } from './storage.service';

@Module({
  imports: [],
  controllers: [],
  providers: [
    JwtService,
    OtpService,
    CacheService,
    MailService,
    StorageService,
    {
      provide: 'REDIS_CLIENT',
      inject: [ConfigService],
      useFactory(config: ConfigService) {
        return new Redis(config.get('redis'));
      },
    },
  ],
  exports: [JwtService, OtpService, CacheService, MailService, StorageService],
})
export class SharedModule {}
