import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CoinsService } from './coins.service';

@Controller('coins')
export class CoinsController {
  constructor(private coinsService: CoinsService) {}

  @Get()
  async findAll() {
    return this.coinsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.coinsService.findById(id);
  }

  @Get(':id/deposit-info')
  @UseGuards(AuthGuard('jwt'))
  async getDepositInfo(@Param('id') id: string) {
    return this.coinsService.getDepositInfo(id);
  }

  @Get(':id/withdraw-info')
  @UseGuards(AuthGuard('jwt'))
  async getWithdrawInfo(@Param('id') id: string) {
    return this.coinsService.getWithdrawInfo(id);
  }
}
