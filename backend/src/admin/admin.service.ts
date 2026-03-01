import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletsService } from '../wallets/wallets.service';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Decimal } from '@prisma/client/runtime/library';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private wallets: WalletsService,
    private email: EmailService,
    private notifications: NotificationsService,
  ) {}

  // ============================================
  // DASHBOARD
  // ============================================
  async getDashboardStats() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart); weekStart.setDate(weekStart.getDate() - 7);
    const [totalUsers, activeUsers, frozenUsers, totalDeposits, totalWithdrawals, pendingDeposits, pendingWithdrawals, approvedDeposits, completedWithdrawals, totalCoins, totalAnnouncements, recentLogs, newUsersToday, newUsersThisWeek] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { status: 'ACTIVE' } }),
        this.prisma.user.count({ where: { status: 'FROZEN' } }),
        this.prisma.deposit.count(),
        this.prisma.withdrawal.count(),
        this.prisma.deposit.count({ where: { status: 'PENDING' } }),
        this.prisma.withdrawal.count({ where: { status: 'PENDING' } }),
        this.prisma.deposit.count({ where: { status: 'APPROVED' } }),
        this.prisma.withdrawal.count({ where: { status: { in: ['APPROVED', 'COMPLETED'] } } }),
        this.prisma.coin.count({ where: { isActive: true } }),
        this.prisma.announcement.count({ where: { isActive: true } }),
        this.prisma.adminLog.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
        this.prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
        this.prisma.user.count({ where: { createdAt: { gte: weekStart } } }),
      ]);

    return {
      totalUsers, activeUsers, frozenUsers, totalDeposits, totalWithdrawals,
      pendingDeposits, pendingWithdrawals,
      approvedDeposits, completedWithdrawals,
      totalCoins, totalAnnouncements,
      recentLogs, newUsersToday, newUsersThisWeek,
    };
  }

  // ============================================
  // USER MANAGEMENT
  // ============================================
  async getUsers(page = 1, limit = 20, search?: string, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } },
      ];
    }
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true, email: true, firstName: true, lastName: true, role: true,
          status: true, kycStatus: true, twoFactorEnabled: true, emailVerified: true,
          lastLoginAt: true, lastLoginIp: true, createdAt: true,
          _count: { select: { wallets: true, deposits: true, withdrawals: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getUserDetail(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallets: { include: { coin: true } },
        loginHistory: { orderBy: { createdAt: 'desc' }, take: 20 },
        deposits: { orderBy: { createdAt: 'desc' }, take: 10, include: { coin: true } },
        withdrawals: { orderBy: { createdAt: 'desc' }, take: 10, include: { coin: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    const { passwordHash, twoFactorSecret, ...safe } = user;
    return safe;
  }

  async createUser(adminId: string, data: { email: string; password: string; firstName?: string; lastName?: string; role?: string; kycStatus?: string; withdrawStage?: string; emailVerified?: boolean }) {
    const existing = await this.prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (existing) throw new BadRequestException('Email already registered');
    const hash = await bcrypt.hash(data.password, parseInt(process.env.BCRYPT_ROUNDS || '12'));
    const { v4: uuidv4 } = await import('uuid');
    const user = await this.prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash: hash,
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        role: data.role || 'USER',
        kycStatus: data.kycStatus || 'NONE',
        withdrawStage: data.withdrawStage || 'BLOCKED',
        emailVerified: data.emailVerified ?? true,
        referralCode: uuidv4().slice(0, 8).toUpperCase(),
        status: 'ACTIVE',
      },
    });
    await this.logAction(adminId, 'CREATE_USER', 'User', user.id, `Created user ${data.email}`);
    const { passwordHash, twoFactorSecret, ...safe } = user;
    return safe;
  }

  async updateUser(adminId: string, userId: string, data: any) {
    const user = await this.prisma.user.update({ where: { id: userId }, data });
    await this.logAction(adminId, 'UPDATE_USER', 'user', userId, JSON.stringify(data));
    const { passwordHash, twoFactorSecret, ...safe } = user;
    return safe;
  }

  async freezeUser(adminId: string, userId: string) {
    await this.prisma.user.update({ where: { id: userId }, data: { status: 'FROZEN' } });
    await this.logAction(adminId, 'FREEZE_USER', 'user', userId);
    await this.notifications.create(userId, 'Account Frozen', 'Your account has been frozen. Contact support for details.');
  }

  async unfreezeUser(adminId: string, userId: string) {
    await this.prisma.user.update({ where: { id: userId }, data: { status: 'ACTIVE' } });
    await this.logAction(adminId, 'UNFREEZE_USER', 'user', userId);
    await this.notifications.create(userId, 'Account Reactivated', 'Your account has been reactivated.');
  }

  async addAdminNote(adminId: string, userId: string, note: string) {
    await this.prisma.user.update({ where: { id: userId }, data: { adminNotes: note } });
    await this.logAction(adminId, 'ADD_NOTE', 'user', userId, note);
  }

  async sendNotification(adminId: string, userId: string, title: string, message: string) {
    await this.notifications.create(userId, title, message);
    await this.logAction(adminId, 'SEND_NOTIFICATION', 'user', userId, `${title}: ${message}`);
  }

  async broadcastNotification(adminId: string, title: string, message: string) {
    const users = await this.prisma.user.findMany({ where: { status: 'ACTIVE' }, select: { id: true } });
    for (const user of users) {
      await this.notifications.create(user.id, title, message);
    }
    await this.logAction(adminId, 'BROADCAST_NOTIFICATION', 'system', 'all', `${title} (${users.length} users)`);
    return { sent: users.length };
  }

  async modifyBalance(adminId: string, userId: string, coinId: string, amount: number, type: 'credit' | 'debit', reason: string) {
    const amountDecimal = new Decimal(Math.abs(amount));
    if (type === 'credit') {
      await this.wallets.creditBalance(userId, coinId, amountDecimal, `Admin credit: ${reason}`, 'ADMIN_CREDIT');
    } else {
      await this.wallets.debitBalance(userId, coinId, amountDecimal, new Decimal(0), `Admin debit: ${reason}`, 'ADMIN_DEBIT');
    }
    await this.logAction(adminId, `MODIFY_BALANCE_${type.toUpperCase()}`, 'wallet', userId, `${amount} (${reason})`);
  }

  async resetUser2FA(adminId: string, userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    });
    await this.logAction(adminId, 'RESET_2FA', 'user', userId);
  }

  async toggleKycStatus(adminId: string, userId: string, kycStatus: string) {
    await this.prisma.user.update({ where: { id: userId }, data: { kycStatus: kycStatus as any } });
    await this.logAction(adminId, 'UPDATE_KYC', 'user', userId, kycStatus);
  }

  // ============================================
  // DEPOSIT MANAGEMENT
  // ============================================
  async getAllDeposits(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.deposit.findMany({
        where,
        include: { coin: true, user: { select: { id: true, email: true, firstName: true, lastName: true, kycStatus: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.deposit.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async approveDeposit(adminId: string, depositId: string, amount: number, comment?: string) {
    const deposit = await this.prisma.deposit.findUnique({ where: { id: depositId }, include: { coin: true, user: true } });
    if (!deposit) throw new NotFoundException('Deposit not found');
    if (deposit.status !== 'PENDING') throw new BadRequestException('Deposit is not pending');

    const amountDecimal = new Decimal(amount);
    await this.wallets.creditBalance(deposit.userId, deposit.coinId, amountDecimal, `Deposit approved: ${depositId}`, 'DEPOSIT', depositId);

    await this.prisma.deposit.update({
      where: { id: depositId },
      data: { status: 'APPROVED', amount: amountDecimal, adminComment: comment, reviewedBy: adminId, reviewedAt: new Date() },
    });

    await this.logAction(adminId, 'APPROVE_DEPOSIT', 'deposit', depositId, `Amount: ${amount} ${deposit.coin.symbol}`);
    await this.notifications.create(deposit.userId, 'Deposit Approved', `Your deposit of ${amount} ${deposit.coin.symbol} has been approved.`);
    await this.email.sendDepositApprovedEmail(deposit.user.email, deposit.coin.symbol, amount.toString());
  }

  async rejectDeposit(adminId: string, depositId: string, comment?: string) {
    const deposit = await this.prisma.deposit.findUnique({ where: { id: depositId }, include: { coin: true } });
    if (!deposit) throw new NotFoundException('Deposit not found');
    if (deposit.status !== 'PENDING') throw new BadRequestException('Deposit is not pending');

    await this.prisma.deposit.update({
      where: { id: depositId },
      data: { status: 'REJECTED', adminComment: comment, reviewedBy: adminId, reviewedAt: new Date() },
    });

    await this.logAction(adminId, 'REJECT_DEPOSIT', 'deposit', depositId, comment);
    await this.notifications.create(deposit.userId, 'Deposit Rejected', `Your deposit for ${deposit.coin.symbol} was rejected. ${comment || ''}`);
  }

  async addManualDeposit(adminId: string, userId: string, coinId: string, amount: number, comment: string) {
    const amountDecimal = new Decimal(amount);
    const coin = await this.prisma.coin.findUnique({ where: { id: coinId } });
    if (!coin) throw new NotFoundException('Coin not found');

    const deposit = await this.prisma.deposit.create({
      data: {
        userId, coinId, amount: amountDecimal, status: 'APPROVED',
        adminComment: `Manual deposit by admin: ${comment}`, reviewedBy: adminId, reviewedAt: new Date(),
      },
    });

    await this.wallets.creditBalance(userId, coinId, amountDecimal, `Manual deposit: ${comment}`, 'ADMIN_CREDIT', deposit.id);
    await this.logAction(adminId, 'MANUAL_DEPOSIT', 'deposit', deposit.id, `${amount} ${coin.symbol} to user ${userId}`);
  }

  // ============================================
  // WITHDRAWAL MANAGEMENT
  // ============================================
  async getAllWithdrawals(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.withdrawal.findMany({
        where,
        include: { coin: true, user: { select: { id: true, email: true, firstName: true, lastName: true, kycStatus: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.withdrawal.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async approveWithdrawal(adminId: string, withdrawalId: string, txHash?: string, comment?: string) {
    const withdrawal = await this.prisma.withdrawal.findUnique({
      where: { id: withdrawalId }, include: { coin: true, user: true },
    });
    if (!withdrawal) throw new NotFoundException('Withdrawal not found');
    if (withdrawal.status !== 'PENDING') throw new BadRequestException('Withdrawal is not pending');

    const totalAmount = new Decimal(withdrawal.amount.toString()).plus(withdrawal.fee.toString());
    await this.wallets.unfreezeBalance(withdrawal.userId, withdrawal.coinId, totalAmount);
    await this.wallets.debitBalance(withdrawal.userId, withdrawal.coinId, withdrawal.amount, withdrawal.fee,
      `Withdrawal approved: ${withdrawalId}`, 'WITHDRAWAL', withdrawalId);

    await this.prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: { status: 'APPROVED', txHash, adminComment: comment, reviewedBy: adminId, reviewedAt: new Date() },
    });

    await this.logAction(adminId, 'APPROVE_WITHDRAWAL', 'withdrawal', withdrawalId, `${withdrawal.amount} ${withdrawal.coin.symbol}`);
    await this.notifications.create(withdrawal.userId, 'Withdrawal Approved', `Your withdrawal of ${withdrawal.amount} ${withdrawal.coin.symbol} has been approved.`);
    await this.email.sendWithdrawalStatusEmail(withdrawal.user.email, withdrawal.coin.symbol, withdrawal.amount.toString(), 'APPROVED');
  }

  async rejectWithdrawal(adminId: string, withdrawalId: string, reason: string, comment?: string) {
    const withdrawal = await this.prisma.withdrawal.findUnique({
      where: { id: withdrawalId }, include: { coin: true, user: true },
    });
    if (!withdrawal) throw new NotFoundException('Withdrawal not found');
    if (withdrawal.status !== 'PENDING') throw new BadRequestException('Withdrawal is not pending');

    const totalAmount = new Decimal(withdrawal.amount.toString()).plus(withdrawal.fee.toString());
    await this.wallets.unfreezeBalance(withdrawal.userId, withdrawal.coinId, totalAmount);

    await this.prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: { status: 'REJECTED', rejectionReason: reason, adminComment: comment, reviewedBy: adminId, reviewedAt: new Date() },
    });

    await this.logAction(adminId, 'REJECT_WITHDRAWAL', 'withdrawal', withdrawalId, reason);
    await this.notifications.create(withdrawal.userId, 'Withdrawal Rejected', `Your withdrawal was rejected. Reason: ${reason}`);
    await this.email.sendWithdrawalStatusEmail(withdrawal.user.email, withdrawal.coin.symbol, withdrawal.amount.toString(), 'REJECTED', reason);
  }

  // ============================================
  // COIN MANAGEMENT
  // ============================================
  async getAllCoins() {
    return this.prisma.coin.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  async createCoin(adminId: string, data: any) {
    const coin = await this.prisma.coin.create({ data });
    await this.logAction(adminId, 'CREATE_COIN', 'coin', coin.id, coin.symbol);
    return coin;
  }

  async updateCoin(adminId: string, coinId: string, data: any) {
    const coin = await this.prisma.coin.update({ where: { id: coinId }, data });
    await this.logAction(adminId, 'UPDATE_COIN', 'coin', coinId, JSON.stringify(data));
    return coin;
  }

  async deleteCoin(adminId: string, coinId: string) {
    await this.prisma.coin.update({ where: { id: coinId }, data: { isActive: false } });
    await this.logAction(adminId, 'DELETE_COIN', 'coin', coinId);
  }

  // ============================================
  // WITHDRAW STAGE
  // ============================================
  async updateWithdrawStage(adminId: string, userId: string, stage: string) {
    const validStages = ['BLOCKED', 'FEE1_REQUIRED', 'FEE1_PAID', 'FEE2_REQUIRED', 'FEE2_PAID', 'UNLOCKED'];
    if (!validStages.includes(stage)) throw new Error(`Invalid stage. Must be one of: ${validStages.join(', ')}`);
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { withdrawStage: stage },
      select: { id: true, email: true, withdrawStage: true },
    });
    await this.logAction(adminId, 'UPDATE_WITHDRAW_STAGE', 'User', userId, `Stage changed to ${stage}`);
    return user;
  }

  // ============================================
  // SETTINGS
  // ============================================
  async updateSetting(adminId: string, key: string, value: string, category = 'general') {
    const setting = await this.prisma.systemSetting.upsert({
      where: { key },
      update: { value, updatedBy: adminId },
      create: { key, value, category, updatedBy: adminId },
    });
    await this.logAction(adminId, 'UPDATE_SETTING', 'setting', key, value);
    return setting;
  }

  async getAllSettings() {
    return this.prisma.systemSetting.findMany({ orderBy: { category: 'asc' } });
  }

  // ============================================
  // ANNOUNCEMENTS
  // ============================================
  async createAnnouncement(adminId: string, data: any) {
    const announcement = await this.prisma.announcement.create({ data: { ...data, createdBy: adminId } });
    await this.logAction(adminId, 'CREATE_ANNOUNCEMENT', 'announcement', announcement.id);
    return announcement;
  }

  async updateAnnouncement(adminId: string, id: string, data: any) {
    const announcement = await this.prisma.announcement.update({ where: { id }, data });
    await this.logAction(adminId, 'UPDATE_ANNOUNCEMENT', 'announcement', id);
    return announcement;
  }

  async deleteAnnouncement(adminId: string, id: string) {
    await this.prisma.announcement.delete({ where: { id } });
    await this.logAction(adminId, 'DELETE_ANNOUNCEMENT', 'announcement', id);
  }

  // ============================================
  // EMAIL
  // ============================================
  async sendEmailToUser(adminId: string, toEmail: string, subject: string, body: string) {
    const result = await this.email.sendCustomEmail(toEmail, subject, body, adminId);
    await this.logAction(adminId, 'SEND_EMAIL', 'email', toEmail, subject);
    return result;
  }

  async getEmailLogs(page = 1, limit = 20) {
    return this.email.getEmailLogs(page, limit);
  }

  // ============================================
  // ADMIN LOGS
  // ============================================
  async getAdminLogs(page = 1, limit = 50, action?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (action) where.action = action;

    const [items, total] = await Promise.all([
      this.prisma.adminLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      this.prisma.adminLog.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async logAction(adminId: string, action: string, targetType?: string, targetId?: string, details?: string) {
    await this.prisma.adminLog.create({
      data: { adminId, action, targetType, targetId, details },
    });
  }

  // ============================================
  // SUPPORT TICKETS
  // ============================================
  async getTickets(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.supportTicket.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      this.prisma.supportTicket.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getTicketById(id: string) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  async replyToTicket(adminId: string, ticketId: string, reply: string) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    const updated = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: { adminReply: reply, repliedBy: adminId, repliedAt: new Date(), status: 'replied' },
    });

    await this.logAction(adminId, 'REPLY_TICKET', 'ticket', ticketId, reply.substring(0, 100));

    // Send reply email to ticket submitter
    try {
      await this.email.sendCustomEmail(ticket.email, `Re: ${ticket.subject}`, reply, adminId);
    } catch {}

    return updated;
  }

  async closeTicket(adminId: string, ticketId: string) {
    const updated = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status: 'closed' },
    });
    await this.logAction(adminId, 'CLOSE_TICKET', 'ticket', ticketId);
    return updated;
  }

  async deleteTicket(adminId: string, ticketId: string) {
    await this.prisma.supportTicket.delete({ where: { id: ticketId } });
    await this.logAction(adminId, 'DELETE_TICKET', 'ticket', ticketId);
  }

  // ============================================
  // ANALYTICS
  // ============================================
  async getAnalytics() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last7d = new Date(todayStart); last7d.setDate(last7d.getDate() - 7);
    const last30d = new Date(todayStart); last30d.setDate(last30d.getDate() - 30);

    const [
      totalUsers, usersToday, users7d, users30d,
      totalDeposits, depositsApproved, depositsPending,
      totalWithdrawals, withdrawalsApproved, withdrawalsPending,
      totalTransactions,
      totalTickets, ticketsOpen,
      totalNotifications,
      totalLoginHistory, successLogins, failedLogins,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
      this.prisma.user.count({ where: { createdAt: { gte: last7d } } }),
      this.prisma.user.count({ where: { createdAt: { gte: last30d } } }),
      this.prisma.deposit.count(),
      this.prisma.deposit.count({ where: { status: 'APPROVED' } }),
      this.prisma.deposit.count({ where: { status: 'PENDING' } }),
      this.prisma.withdrawal.count(),
      this.prisma.withdrawal.count({ where: { status: { in: ['APPROVED', 'COMPLETED'] } } }),
      this.prisma.withdrawal.count({ where: { status: 'PENDING' } }),
      this.prisma.transaction.count(),
      this.prisma.supportTicket.count(),
      this.prisma.supportTicket.count({ where: { status: 'open' } }),
      this.prisma.notification.count(),
      this.prisma.loginHistory.count(),
      this.prisma.loginHistory.count({ where: { success: true } }),
      this.prisma.loginHistory.count({ where: { success: false } }),
    ]);

    return {
      users: { total: totalUsers, today: usersToday, last7d: users7d, last30d: users30d },
      deposits: { total: totalDeposits, approved: depositsApproved, pending: depositsPending },
      withdrawals: { total: totalWithdrawals, approved: withdrawalsApproved, pending: withdrawalsPending },
      transactions: { total: totalTransactions },
      tickets: { total: totalTickets, open: ticketsOpen },
      notifications: { total: totalNotifications },
      logins: { total: totalLoginHistory, success: successLogins, failed: failedLogins },
    };
  }
}
