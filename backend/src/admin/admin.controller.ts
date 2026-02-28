import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminService } from './admin.service';
import { AuthService } from '../auth/auth.service';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class AdminController {
  constructor(
    private adminService: AdminService,
    private authService: AuthService,
  ) {}

  // Dashboard
  @Get('dashboard')
  async getDashboard() {
    return this.adminService.getDashboardStats();
  }

  // Users
  @Post('users')
  async createUser(@Req() req: any, @Body() body: { email: string; password: string; firstName?: string; lastName?: string; role?: string; kycStatus?: string; withdrawStage?: string; emailVerified?: boolean }) {
    return this.adminService.createUser(req.user.id, body);
  }

  @Get('users')
  async getUsers(@Query('page') page?: number, @Query('limit') limit?: number, @Query('search') search?: string, @Query('status') status?: string) {
    return this.adminService.getUsers(page || 1, limit || 20, search, status);
  }

  @Get('users/:id')
  async getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Put('users/:id')
  async updateUser(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.adminService.updateUser(req.user.id, id, body);
  }

  @Patch('users/:id/freeze')
  async freezeUser(@Req() req: any, @Param('id') id: string) {
    return this.adminService.freezeUser(req.user.id, id);
  }

  @Patch('users/:id/unfreeze')
  async unfreezeUser(@Req() req: any, @Param('id') id: string) {
    return this.adminService.unfreezeUser(req.user.id, id);
  }

  @Patch('users/:id/notes')
  async addNote(@Req() req: any, @Param('id') id: string, @Body() body: { note: string }) {
    return this.adminService.addAdminNote(req.user.id, id, body.note);
  }

  @Post('users/:id/balance')
  async modifyBalance(@Req() req: any, @Param('id') id: string, @Body() body: { coinId: string; amount: number; type: 'credit' | 'debit'; reason: string }) {
    return this.adminService.modifyBalance(req.user.id, id, body.coinId, body.amount, body.type, body.reason);
  }

  @Post('users/:id/notify')
  async sendNotification(@Req() req: any, @Param('id') id: string, @Body() body: { title: string; message: string }) {
    await this.adminService.sendNotification(req.user.id, id, body.title, body.message);
    return { success: true };
  }

  @Post('broadcast')
  async broadcastNotification(@Req() req: any, @Body() body: { title: string; message: string }) {
    return this.adminService.broadcastNotification(req.user.id, body.title, body.message);
  }

  @Patch('users/:id/reset-2fa')
  async reset2FA(@Req() req: any, @Param('id') id: string) {
    return this.adminService.resetUser2FA(req.user.id, id);
  }

  @Patch('users/:id/kyc')
  async updateKyc(@Req() req: any, @Param('id') id: string, @Body() body: { kycStatus: string }) {
    return this.adminService.toggleKycStatus(req.user.id, id, body.kycStatus);
  }

  @Patch('users/:id/withdraw-stage')
  async updateWithdrawStage(@Req() req: any, @Param('id') id: string, @Body() body: { stage: string }) {
    return this.adminService.updateWithdrawStage(req.user.id, id, body.stage);
  }

  // Deposits
  @Get('deposits')
  async getDeposits(@Query('page') page?: number, @Query('limit') limit?: number, @Query('status') status?: string) {
    return this.adminService.getAllDeposits(page || 1, limit || 20, status);
  }

  @Patch('deposits/:id/approve')
  async approveDeposit(@Req() req: any, @Param('id') id: string, @Body() body: { amount: number; comment?: string }) {
    return this.adminService.approveDeposit(req.user.id, id, body.amount, body.comment);
  }

  @Patch('deposits/:id/reject')
  async rejectDeposit(@Req() req: any, @Param('id') id: string, @Body() body: { comment?: string }) {
    return this.adminService.rejectDeposit(req.user.id, id, body.comment);
  }

  @Post('deposits/manual')
  async manualDeposit(@Req() req: any, @Body() body: { userId: string; coinId: string; amount: number; comment: string }) {
    return this.adminService.addManualDeposit(req.user.id, body.userId, body.coinId, body.amount, body.comment);
  }

  // Withdrawals
  @Get('withdrawals')
  async getWithdrawals(@Query('page') page?: number, @Query('limit') limit?: number, @Query('status') status?: string) {
    return this.adminService.getAllWithdrawals(page || 1, limit || 20, status);
  }

  @Patch('withdrawals/:id/approve')
  async approveWithdrawal(@Req() req: any, @Param('id') id: string, @Body() body: { txHash?: string; comment?: string }) {
    return this.adminService.approveWithdrawal(req.user.id, id, body.txHash, body.comment);
  }

  @Patch('withdrawals/:id/reject')
  async rejectWithdrawal(@Req() req: any, @Param('id') id: string, @Body() body: { reason: string; comment?: string }) {
    return this.adminService.rejectWithdrawal(req.user.id, id, body.reason, body.comment);
  }

  // Coins
  @Get('coins')
  async getCoins() {
    return this.adminService.getAllCoins();
  }

  @Post('coins')
  async createCoin(@Req() req: any, @Body() body: any) {
    return this.adminService.createCoin(req.user.id, body);
  }

  @Put('coins/:id')
  async updateCoin(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.adminService.updateCoin(req.user.id, id, body);
  }

  @Delete('coins/:id')
  async deleteCoin(@Req() req: any, @Param('id') id: string) {
    return this.adminService.deleteCoin(req.user.id, id);
  }

  // Settings
  @Get('settings')
  async getSettings() {
    return this.adminService.getAllSettings();
  }

  @Put('settings')
  async updateSetting(@Req() req: any, @Body() body: { key: string; value: string; category?: string }) {
    return this.adminService.updateSetting(req.user.id, body.key, body.value, body.category);
  }

  // Announcements
  @Post('announcements')
  async createAnnouncement(@Req() req: any, @Body() body: any) {
    return this.adminService.createAnnouncement(req.user.id, body);
  }

  @Put('announcements/:id')
  async updateAnnouncement(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.adminService.updateAnnouncement(req.user.id, id, body);
  }

  @Delete('announcements/:id')
  async deleteAnnouncement(@Req() req: any, @Param('id') id: string) {
    return this.adminService.deleteAnnouncement(req.user.id, id);
  }

  // Email
  @Post('email/send')
  async sendEmail(@Req() req: any, @Body() body: { toEmail: string; subject: string; body: string }) {
    return this.adminService.sendEmailToUser(req.user.id, body.toEmail, body.subject, body.body);
  }

  @Get('email/logs')
  async getEmailLogs(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.getEmailLogs(page || 1, limit || 20);
  }

  // Admin Logs
  @Get('logs')
  async getLogs(@Query('page') page?: number, @Query('limit') limit?: number, @Query('action') action?: string) {
    return this.adminService.getAdminLogs(page || 1, limit || 50, action);
  }

  // Magic Login Links
  @Post('users/:id/magic-link')
  async createMagicLink(@Req() req: any, @Param('id') userId: string, @Body() body: { expiresInHours?: number }) {
    const result = await this.authService.createMagicLink(userId, req.user.id, body.expiresInHours || 24);
    await this.adminService.logAction(req.user.id, 'CREATE_MAGIC_LINK', 'User', userId, `Created magic login link for user`);
    return result;
  }

  // Support Tickets
  @Get('tickets')
  async getTickets(@Query('page') page?: number, @Query('limit') limit?: number, @Query('status') status?: string) {
    return this.adminService.getTickets(page || 1, limit || 20, status);
  }

  @Get('tickets/:id')
  async getTicket(@Param('id') id: string) {
    return this.adminService.getTicketById(id);
  }

  @Patch('tickets/:id/reply')
  async replyTicket(@Req() req: any, @Param('id') id: string, @Body() body: { reply: string }) {
    return this.adminService.replyToTicket(req.user.id, id, body.reply);
  }

  @Patch('tickets/:id/close')
  async closeTicket(@Req() req: any, @Param('id') id: string) {
    return this.adminService.closeTicket(req.user.id, id);
  }

  @Delete('tickets/:id')
  async deleteTicket(@Req() req: any, @Param('id') id: string) {
    return this.adminService.deleteTicket(req.user.id, id);
  }

  // Platform Analytics
  @Get('analytics')
  async getAnalytics() {
    return this.adminService.getAnalytics();
  }
}
