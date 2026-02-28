import { Controller, Post, Get, Body, UseGuards, Req, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DepositsService } from './deposits.service';

@Controller('deposits')
@UseGuards(AuthGuard('jwt'))
export class DepositsController {
  constructor(private depositsService: DepositsService) {}

  @Post()
  async createDeposit(
    @Req() req: any,
    @Body() body: { coinId: string; txHash?: string; amount?: number; userNote?: string },
  ) {
    return this.depositsService.createDepositRequest(req.user.id, body.coinId, body.txHash, body.amount, body.userNote);
  }

  @Get()
  async getMyDeposits(
    @Req() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.depositsService.getUserDeposits(req.user.id, page || 1, limit || 20, status);
  }
}
