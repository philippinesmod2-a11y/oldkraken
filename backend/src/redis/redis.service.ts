import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';

interface CacheEntry {
  value: string;
  expiresAt?: number;
}

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private memoryCache: Map<string, CacheEntry> = new Map();
  private useMemory = true;

  constructor() {
    this.logger.log('Using in-memory cache (Redis disabled for local dev)');
  }

  getClient(): any {
    return null;
  }

  async get(key: string): Promise<string | null> {
    const entry = this.memoryCache.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.memoryCache.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    this.memoryCache.set(key, {
      value,
      expiresAt: ttl ? Date.now() + ttl * 1000 : undefined,
    });
  }

  async del(key: string): Promise<void> {
    this.memoryCache.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    const entry = this.memoryCache.get(key);
    if (!entry) return false;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.memoryCache.delete(key);
      return false;
    }
    return true;
  }

  async incr(key: string): Promise<number> {
    const current = await this.get(key);
    const newVal = (parseInt(current || '0') || 0) + 1;
    await this.set(key, String(newVal));
    return newVal;
  }

  async expire(key: string, ttl: number): Promise<void> {
    const entry = this.memoryCache.get(key);
    if (entry) {
      entry.expiresAt = Date.now() + ttl * 1000;
    }
  }

  async getJson<T>(key: string): Promise<T | null> {
    const data = await this.get(key);
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  }

  async setJson(key: string, value: any, ttl?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttl);
  }

  async onModuleDestroy() {
    this.memoryCache.clear();
  }
}
