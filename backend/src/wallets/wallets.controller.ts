import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WalletsService } from './wallets.service';

@Controller('wallets')
@UseGuards(AuthGuard('jwt'))
export class WalletsController {
  constructor(private walletsService: WalletsService) {}

  @Get()
  async getUserWallets(@Req() req: any) {
    return this.walletsService.getUserWallets(req.user.id);
  }

  @Get(':coinId/balance')
  async getBalance(@Req() req: any, @Param('coinId') coinId: string) {
    return this.walletsService.getWalletBalance(req.user.id, coinId);
  }
}
