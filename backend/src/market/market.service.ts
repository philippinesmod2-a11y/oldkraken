import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class MarketService {
  private readonly logger = new Logger(MarketService.name);
  private readonly COINGECKO_URL = process.env.COINGECKO_API_URL || 'https://api.coingecko.com/api/v3';

  constructor(private redis: RedisService) {}

  async getMarketData(page = 1, perPage = 100) {
    const cacheKey = `market:data:${page}:${perPage}`;
    const cached = await this.redis.getJson<any>(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(
        `${this.COINGECKO_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=true&price_change_percentage=1h,24h,7d`,
      );
      const data = await response.json();
      await this.redis.setJson(cacheKey, data, 20);
      return data;
    } catch (error) {
      this.logger.error(`Failed to fetch market data: ${error.message}`);
      return [];
    }
  }

  async getCoinPrice(coinId: string) {
    const cacheKey = `market:price:${coinId}`;
    const cached = await this.redis.getJson<any>(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(
        `${this.COINGECKO_URL}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`,
      );
      const data = await response.json();
      await this.redis.setJson(cacheKey, data, 15);
      return data;
    } catch (error) {
      this.logger.error(`Failed to fetch coin price: ${error.message}`);
      return null;
    }
  }

  async getGlobalData() {
    const cacheKey = 'market:global';
    const cached = await this.redis.getJson<any>(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`${this.COINGECKO_URL}/global`);
      const data = await response.json();
      await this.redis.setJson(cacheKey, data, 30);
      return data;
    } catch (error) {
      this.logger.error(`Failed to fetch global data: ${error.message}`);
      return null;
    }
  }

  async getFearGreedIndex() {
    const cacheKey = 'market:feargreed';
    const cached = await this.redis.getJson<any>(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch('https://api.alternative.me/fng/?limit=1');
      const data = await response.json();
      await this.redis.setJson(cacheKey, data, 300);
      return data;
    } catch (error) {
      this.logger.error(`Failed to fetch fear & greed: ${error.message}`);
      return { data: [{ value: '50', value_classification: 'Neutral' }] };
    }
  }

  async getTrendingCoins() {
    const cacheKey = 'market:trending';
    const cached = await this.redis.getJson<any>(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`${this.COINGECKO_URL}/search/trending`);
      const data = await response.json();
      await this.redis.setJson(cacheKey, data, 60);
      return data;
    } catch (error) {
      this.logger.error(`Failed to fetch trending: ${error.message}`);
      return { coins: [] };
    }
  }
}
