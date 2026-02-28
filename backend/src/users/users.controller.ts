import { Controller, Get, Put, Body, UseGuards, Req, Param, Query, Patch } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  async getProfile(@Req() req: any) {
    return this.usersService.findById(req.user.id);
  }

  @Get('withdraw-stage')
  async getWithdrawStage(@Req() req: any) {
    return this.usersService.getWithdrawStage(req.user.id);
  }

  @Put('profile')
  async updateProfile(@Req() req: any, @Body() body: { firstName?: string; lastName?: string; phone?: string; country?: string }) {
    return this.usersService.updateProfile(req.user.id, body);
  }

  @Get('login-history')
  async getLoginHistory(@Req() req: any, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.usersService.getLoginHistory(req.user.id, page || 1, limit || 20);
  }

  @Get('activity')
  async getActivityLog(@Req() req: any, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.usersService.getActivityLog(req.user.id, page || 1, limit || 20);
  }

  @Get('notifications')
  async getNotifications(@Req() req: any, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.usersService.getNotifications(req.user.id, page || 1, limit || 20);
  }

  @Patch('notifications/:id/read')
  async markRead(@Req() req: any, @Param('id') id: string) {
    return this.usersService.markNotificationRead(req.user.id, id);
  }

  @Patch('notifications/read-all')
  async markAllRead(@Req() req: any) {
    return this.usersService.markAllNotificationsRead(req.user.id);
  }
}
