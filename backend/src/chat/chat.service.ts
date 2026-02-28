import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuid } from 'uuid';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateSession(visitorId: string, visitorName?: string, visitorEmail?: string) {
    let session = await this.prisma.chatSession.findFirst({
      where: { visitorId, status: 'active' },
      include: { messages: { orderBy: { createdAt: 'asc' }, take: 50 } },
    });
    if (!session) {
      session = await this.prisma.chatSession.create({
        data: { visitorId, visitorName, visitorEmail, status: 'active' },
        include: { messages: { orderBy: { createdAt: 'asc' }, take: 50 } },
      });
    }
    return session;
  }

  async addMessage(sessionId: string, sender: 'visitor' | 'admin', message: string) {
    const msg = await this.prisma.chatMessage.create({
      data: { sessionId, sender, message },
    });
    await this.prisma.chatSession.update({
      where: { id: sessionId },
      data: { lastMessageAt: new Date() },
    });
    return msg;
  }

  async getSessionMessages(sessionId: string) {
    return this.prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getAllSessions(status?: string) {
    const where: any = {};
    if (status) where.status = status;
    return this.prisma.chatSession.findMany({
      where,
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        _count: { select: { messages: true } },
      },
      orderBy: { lastMessageAt: 'desc' },
    });
  }

  async getUnreadCount() {
    return this.prisma.chatMessage.count({
      where: { sender: 'visitor', isRead: false },
    });
  }

  async markSessionRead(sessionId: string) {
    await this.prisma.chatMessage.updateMany({
      where: { sessionId, sender: 'visitor', isRead: false },
      data: { isRead: true },
    });
  }

  async closeSession(sessionId: string) {
    return this.prisma.chatSession.update({
      where: { id: sessionId },
      data: { status: 'closed' },
    });
  }

  async deleteSession(sessionId: string) {
    await this.prisma.chatMessage.deleteMany({ where: { sessionId } });
    return this.prisma.chatSession.delete({ where: { id: sessionId } });
  }
}
