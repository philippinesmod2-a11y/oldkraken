import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletsService } from '../wallets/wallets.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class DepositsService {
  constructor(
    private prisma: PrismaService,
    private wallets: WalletsService,
  ) {}

  async createDepositRequest(userId: string, coinId: string, txHash?: string, amount?: number, userNote?: string) {
    const coin = await this.prisma.coin.findUnique({ where: { id: coinId } });
    if (!coin) throw new NotFoundException('Coin not found');
    if (!coin.depositEnabled) throw new BadRequestException('Deposits are disabled for this asset');

    return this.prisma.deposit.create({
      data: {
        userId,
        coinId,
        txHash,
        amount: amount ? new Decimal(amount) : null,
        network: coin.network,
        userNote,
        status: 'PENDING',
      },
      include: { coin: true },
    });
  }

  async getUserDeposits(userId: string, page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = { userId };
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.deposit.findMany({
        where,
        include: { coin: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.deposit.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getDepositById(id: string) {
    const deposit = await this.prisma.deposit.findUnique({
      where: { id },
      include: { coin: true, user: { select: { id: true, email: true, firstName: true, lastName: true } } },
    });
    if (!deposit) throw new NotFoundException('Deposit not found');
    return deposit;
  }
}
