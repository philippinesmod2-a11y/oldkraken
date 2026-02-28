import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, title: string, message: string, type = 'info', metadata?: any) {
    return this.prisma.notification.create({
      data: { userId, title, message, type, metadata },
    });
  }

  async createBulk(userIds: string[], title: string, message: string, type = 'info') {
    const data = userIds.map((userId) => ({ userId, title, message, type }));
    return this.prisma.notification.createMany({ data });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({ where: { userId, isRead: false } });
  }
}
