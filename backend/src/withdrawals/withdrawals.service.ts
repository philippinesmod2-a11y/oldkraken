import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletsService } from '../wallets/wallets.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class WithdrawalsService {
  constructor(
    private prisma: PrismaService,
    private wallets: WalletsService,
  ) {}

  async createWithdrawalRequest(userId: string, coinId: string, amount: number, address: string, network?: string, userNote?: string) {
    const coin = await this.prisma.coin.findUnique({ where: { id: coinId } });
    if (!coin) throw new NotFoundException('Coin not found');
    if (!coin.withdrawEnabled) throw new BadRequestException('Withdrawals are disabled for this asset');

    const amountDecimal = new Decimal(amount);
    if (amountDecimal.lessThan(coin.withdrawalMinimum)) {
      throw new BadRequestException(`Minimum withdrawal is ${coin.withdrawalMinimum} ${coin.symbol}`);
    }

    const wallet = await this.wallets.getOrCreateWallet(userId, coinId);
    const available = new Decimal(wallet.balance.toString()).minus(wallet.frozenBalance.toString());
    const totalAmount = amountDecimal.plus(coin.withdrawalFee);

    if (available.lessThan(totalAmount)) {
      throw new BadRequestException('Insufficient balance');
    }

    await this.wallets.freezeBalance(userId, coinId, totalAmount);

    return this.prisma.withdrawal.create({
      data: {
        userId,
        coinId,
        amount: amountDecimal,
        fee: coin.withdrawalFee,
        address,
        network: network || coin.network,
        userNote,
        status: 'PENDING',
      },
      include: { coin: true },
    });
  }

  async getUserWithdrawals(userId: string, page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = { userId };
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.withdrawal.findMany({
        where,
        include: { coin: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.withdrawal.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async cancelWithdrawal(userId: string, withdrawalId: string) {
    const withdrawal = await this.prisma.withdrawal.findUnique({ where: { id: withdrawalId } });
    if (!withdrawal) throw new NotFoundException('Withdrawal not found');
    if (withdrawal.userId !== userId) throw new BadRequestException('Not your withdrawal');
    if (withdrawal.status !== 'PENDING') throw new BadRequestException('Can only cancel pending withdrawals');

    const totalAmount = new Decimal(withdrawal.amount.toString()).plus(withdrawal.fee.toString());
    await this.wallets.unfreezeBalance(userId, withdrawal.coinId, totalAmount);

    return this.prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: { status: 'CANCELLED' },
      include: { coin: true },
    });
  }
}
