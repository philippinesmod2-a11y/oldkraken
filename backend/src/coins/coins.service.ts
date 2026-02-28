import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CoinsService {
  constructor(private prisma: PrismaService) {}

  async findAll(activeOnly = true) {
    return this.prisma.coin.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findById(id: string) {
    const coin = await this.prisma.coin.findUnique({ where: { id } });
    if (!coin) throw new NotFoundException('Coin not found');
    return coin;
  }

  async findBySymbol(symbol: string) {
    const coin = await this.prisma.coin.findUnique({ where: { symbol: symbol.toUpperCase() } });
    if (!coin) throw new NotFoundException('Coin not found');
    return coin;
  }

  async getDepositInfo(coinId: string) {
    const coin = await this.findById(coinId);
    if (!coin.depositEnabled) {
      return { enabled: false, message: 'Deposits are currently disabled for this asset.' };
    }
    return {
      enabled: true,
      address: coin.depositAddress,
      qrCode: coin.depositQrCode,
      network: coin.network,
      instructions: coin.depositInstructions,
      minimum: coin.depositMinimum,
      confirmationNotes: coin.confirmationNotes,
    };
  }

  async getWithdrawInfo(coinId: string) {
    const coin = await this.findById(coinId);
    if (!coin.withdrawEnabled) {
      return { enabled: false, message: 'Withdrawals are currently disabled for this asset.' };
    }
    return {
      enabled: true,
      fee: coin.withdrawalFee,
      minimum: coin.withdrawalMinimum,
      network: coin.network,
    };
  }
}
