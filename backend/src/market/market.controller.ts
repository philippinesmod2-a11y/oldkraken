import { Controller, Get, Param, Query } from '@nestjs/common';
import { MarketService } from './market.service';

@Controller('market')
export class MarketController {
  constructor(private marketService: MarketService) {}

  @Get()
  async getMarketData(@Query('page') page?: number, @Query('perPage') perPage?: number) {
    return this.marketService.getMarketData(page || 1, perPage || 100);
  }

  @Get('global')
  async getGlobalData() {
    const raw = await this.marketService.getGlobalData();
    if (!raw?.data) return { btcDominance: '0', totalMarketCap: 0, totalVolume: 0 };
    return {
      btcDominance: raw.data.market_cap_percentage?.btc?.toFixed(1) || '0',
      totalMarketCap: raw.data.total_market_cap?.usd || 0,
      totalVolume: raw.data.total_volume?.usd || 0,
      activeCryptos: raw.data.active_cryptocurrencies || 0,
    };
  }

  @Get('fear-greed')
  async getFearGreed() {
    const raw = await this.marketService.getFearGreedIndex();
    const entry = raw?.data?.[0];
    return {
      value: entry?.value || '50',
      classification: entry?.value_classification || 'Neutral',
    };
  }

  @Get('trending')
  async getTrending() {
    return this.marketService.getTrendingCoins();
  }

  @Get('price/:coinId')
  async getCoinPrice(@Param('coinId') coinId: string) {
    return this.marketService.getCoinPrice(coinId);
  }
}
