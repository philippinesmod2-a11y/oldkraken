import { Controller, Get, UseGuards, Req, Query, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TransactionsService } from './transactions.service';

@Controller('transactions')
@UseGuards(AuthGuard('jwt'))
export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  @Get()
  async getMyTransactions(
    @Req() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('coinId') coinId?: string,
    @Query('type') type?: string,
  ) {
    return this.transactionsService.getUserTransactions(req.user.id, page || 1, limit || 20, coinId, type);
  }

  @Get(':id')
  async getTransaction(@Req() req: any, @Param('id') id: string) {
    return this.transactionsService.getTransactionById(id, req.user.id);
  }
}
