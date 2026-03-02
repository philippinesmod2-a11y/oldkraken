import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class WalletsService {
  constructor(private prisma: PrismaService) {}

  async getUserWallets(userId: string) {
    const wallets = await this.prisma.wallet.findMany({
      where: { userId },
      include: { coin: true },
      orderBy: { coin: { sortOrder: 'asc' } },
    });
    return wallets;
  }

  async getOrCreateWallet(userId: string, coinId: string) {
    let wallet = await this.prisma.wallet.findUnique({
      where: { userId_coinId: { userId, coinId } },
      include: { coin: true },
    });

    if (!wallet) {
      try {
        wallet = await this.prisma.wallet.create({
          data: { userId, coinId },
          include: { coin: true },
        });
      } catch (e: any) {
        // Handle race condition: another request already created this wallet
        if (e.code === 'P2002') {
          wallet = await this.prisma.wallet.findUnique({
            where: { userId_coinId: { userId, coinId } },
            include: { coin: true },
          });
          if (!wallet) throw e;
        } else {
          throw e;
        }
      }
    }
    return wallet;
  }

  async getWalletBalance(userId: string, coinId: string) {
    const wallet = await this.getOrCreateWallet(userId, coinId);
    return {
      balance: wallet.balance,
      frozenBalance: wallet.frozenBalance,
      availableBalance: new Decimal(wallet.balance.toString()).minus(wallet.frozenBalance.toString()),
    };
  }

  async creditBalance(userId: string, coinId: string, amount: Decimal, description: string, type: string, referenceId?: string) {
    if (amount.lessThanOrEqualTo(0)) throw new BadRequestException('Amount must be positive');

    const wallet = await this.getOrCreateWallet(userId, coinId);
    const balanceBefore = wallet.balance;
    const balanceAfter = new Decimal(balanceBefore.toString()).plus(amount.toString());

    const [updatedWallet, transaction] = await this.prisma.$transaction([
      this.prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: balanceAfter },
      }),
      this.prisma.transaction.create({
        data: {
          userId,
          coinId,
          type: type as any,
          status: 'COMPLETED',
          amount,
          balanceBefore,
          balanceAfter,
          description,
          referenceId,
        },
      }),
    ]);

    return { wallet: updatedWallet, transaction };
  }

  async debitBalance(userId: string, coinId: string, amount: Decimal, fee: Decimal, description: string, type: string, referenceId?: string) {
    if (amount.lessThanOrEqualTo(0)) throw new BadRequestException('Amount must be positive');

    const wallet = await this.getOrCreateWallet(userId, coinId);
    const totalDebit = new Decimal(amount.toString()).plus(fee.toString());
    const available = new Decimal(wallet.balance.toString()).minus(wallet.frozenBalance.toString());

    if (available.lessThan(totalDebit)) {
      throw new BadRequestException('Insufficient balance');
    }

    const balanceBefore = wallet.balance;
    const balanceAfter = new Decimal(balanceBefore.toString()).minus(totalDebit.toString());

    if (balanceAfter.lessThan(0)) throw new BadRequestException('Balance cannot go negative');

    const [updatedWallet, transaction] = await this.prisma.$transaction([
      this.prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: balanceAfter },
      }),
      this.prisma.transaction.create({
        data: {
          userId,
          coinId,
          type: type as any,
          status: 'COMPLETED',
          amount,
          fee,
          balanceBefore,
          balanceAfter,
          description,
          referenceId,
        },
      }),
    ]);

    return { wallet: updatedWallet, transaction };
  }

  async freezeBalance(userId: string, coinId: string, amount: Decimal) {
    const wallet = await this.getOrCreateWallet(userId, coinId);
    const available = new Decimal(wallet.balance.toString()).minus(wallet.frozenBalance.toString());

    if (available.lessThan(amount)) throw new BadRequestException('Insufficient available balance');

    return this.prisma.wallet.update({
      where: { id: wallet.id },
      data: { frozenBalance: new Decimal(wallet.frozenBalance.toString()).plus(amount.toString()) },
    });
  }

  async unfreezeBalance(userId: string, coinId: string, amount: Decimal) {
    const wallet = await this.getOrCreateWallet(userId, coinId);

    if (new Decimal(wallet.frozenBalance.toString()).lessThan(amount)) {
      throw new BadRequestException('Cannot unfreeze more than frozen amount');
    }

    return this.prisma.wallet.update({
      where: { id: wallet.id },
      data: { frozenBalance: new Decimal(wallet.frozenBalance.toString()).minus(amount.toString()) },
    });
  }
}
