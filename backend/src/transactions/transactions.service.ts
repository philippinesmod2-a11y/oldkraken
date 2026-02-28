import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async getUserTransactions(userId: string, page = 1, limit = 20, coinId?: string, type?: string) {
    const skip = (page - 1) * limit;
    const where: any = { userId };
    if (coinId) where.coinId = coinId;
    if (type) where.type = type;

    const [items, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: { coin: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getTransactionById(id: string, userId?: string) {
    const tx = await this.prisma.transaction.findUnique({
      where: { id },
      include: { coin: true, user: { select: { id: true, email: true, firstName: true, lastName: true } } },
    });
    if (tx && userId && tx.userId !== userId) return null;
    return tx;
  }
}
