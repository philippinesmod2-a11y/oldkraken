import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async get(key: string): Promise<string | null> {
    const setting = await this.prisma.systemSetting.findUnique({ where: { key } });
    return setting?.value || null;
  }

  async set(key: string, value: string, type = 'string', category = 'general', description?: string, updatedBy?: string) {
    return this.prisma.systemSetting.upsert({
      where: { key },
      update: { value, updatedBy },
      create: { key, value, type, category, description, updatedBy },
    });
  }

  async getByCategory(category: string) {
    return this.prisma.systemSetting.findMany({ where: { category }, orderBy: { key: 'asc' } });
  }

  async getAll() {
    return this.prisma.systemSetting.findMany({ orderBy: { category: 'asc' } });
  }

  async delete(key: string) {
    return this.prisma.systemSetting.delete({ where: { key } });
  }

  async getPublicSettings() {
    const settings = await this.prisma.systemSetting.findMany({
      where: { category: { in: ['public', 'branding', 'content', 'general'] } },
    });
    const map: Record<string, string> = {};
    settings.forEach((s) => (map[s.key] = s.value));
    return map;
  }

  async getPlatformStats() {
    const [totalUsers, totalCoins, totalDeposits] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.coin.count({ where: { isActive: true } }),
      this.prisma.deposit.count({ where: { status: 'APPROVED' } }),
    ]);
    return { totalUsers, totalCoins, totalDeposits };
  }

  async getAnnouncements() {
    return this.prisma.announcement.findMany({
      where: {
        isActive: true,
        OR: [
          { startsAt: null, endsAt: null },
          { startsAt: { lte: new Date() }, endsAt: null },
          { startsAt: null, endsAt: { gte: new Date() } },
          { startsAt: { lte: new Date() }, endsAt: { gte: new Date() } },
        ],
      },
      orderBy: { priority: 'desc' },
    });
  }
}
