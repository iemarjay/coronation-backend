import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class CacheService {
  constructor(@Inject('REDIS_CLIENT') private readonly client: Redis) {}

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const serializedValue = JSON.stringify(value);
    if (ttl) {
      await this.client.set(key, serializedValue, 'EX', ttl);
    } else {
      await this.client.set(key, serializedValue);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    if (!value) {
      return null;
    }
    return JSON.parse(value);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async remember<T>(
    key: string,
    ttl: number,
    cb: () => Promise<T>,
  ): Promise<T> {
    let value = await this.get<T>(key);
    if (value) {
      return value;
    }

    value = await cb();
    await this.set(key, value, ttl);
    return value;
  }
}

export enum TTL {
  FIVE_MINUTES = 300,
  TEN_MINUTES = 600,
  ONE_HOUR = 3600,
  ONE_DAY = 86400,
  ONE_WEEK = 604800,
  ONE_MONTH = 2592000,
  ONE_YEAR = 31536000,
}
