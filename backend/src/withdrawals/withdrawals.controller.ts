import { Controller, Post, Get, Body, UseGuards, Req, Query, Param, Patch } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WithdrawalsService } from './withdrawals.service';

@Controller('withdrawals')
@UseGuards(AuthGuard('jwt'))
export class WithdrawalsController {
  constructor(private withdrawalsService: WithdrawalsService) {}

  @Post()
  async createWithdrawal(
    @Req() req: any,
    @Body() body: { coinId: string; amount: number; address: string; network?: string; userNote?: string },
  ) {
    return this.withdrawalsService.createWithdrawalRequest(
      req.user.id, body.coinId, body.amount, body.address, body.network, body.userNote,
    );
  }

  @Get()
  async getMyWithdrawals(
    @Req() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.withdrawalsService.getUserWithdrawals(req.user.id, page || 1, limit || 20, status);
  }

  @Patch(':id/cancel')
  async cancelWithdrawal(@Req() req: any, @Param('id') id: string) {
    return this.withdrawalsService.cancelWithdrawal(req.user.id, id);
  }
}
