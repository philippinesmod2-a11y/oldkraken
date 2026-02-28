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
    return this.marketService.getGlobalData();
  }

  @Get('fear-greed')
  async getFearGreed() {
    return this.marketService.getFearGreedIndex();
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
