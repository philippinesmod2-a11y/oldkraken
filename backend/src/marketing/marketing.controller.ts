import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards, Headers, Ip } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MarketingService } from './marketing.service';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';

@Controller('marketing')
export class MarketingController {

  constructor(private marketingService: MarketingService) {}

  // ============================================
  // PUBLIC ENDPOINTS (no auth required)
  // ============================================

  @Get('forms/:slug')
  async getPublicForm(@Param('slug') slug: string) {
    return this.marketingService.getFormBySlug(slug);
  }

  @Post('subscribe')
  async subscribe(
    @Body() body: { email: string; firstName?: string; lastName?: string; phone?: string; formId?: string },
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.marketingService.subscribe({ ...body, ipAddress: ip, userAgent });
  }

  @Get('confirm')
  async confirmSubscription(@Query('token') token: string) {
    return this.marketingService.confirmSubscription(token);
  }

  @Get('unsubscribe')
  async unsubscribe(@Query('token') token: string) {
    return this.marketingService.unsubscribe(token);
  }

  // ============================================
  // ADMIN ENDPOINTS (auth required)
  // ============================================

  @Get('admin/stats')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getStats() {
    return this.marketingService.getStats();
  }

  // Forms
  @Get('admin/forms')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getForms() {
    return this.marketingService.getForms();
  }

  @Post('admin/forms')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async createForm(@Req() req: any, @Body() body: any) {
    return this.marketingService.createForm(req.user.id, body);
  }

  @Put('admin/forms/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async updateForm(@Param('id') id: string, @Body() body: any) {
    return this.marketingService.updateForm(id, body);
  }

  @Delete('admin/forms/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async deleteForm(@Param('id') id: string) {
    return this.marketingService.deleteForm(id);
  }

  // Subscribers
  @Get('admin/subscribers')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getSubscribers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('formId') formId?: string,
  ) {
    return this.marketingService.getSubscribers(Number(page) || 1, Number(limit) || 50, status, formId);
  }

  @Post('admin/subscribers')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async addSubscriber(@Req() req: any, @Body() body: { email: string; firstName?: string; lastName?: string }) {
    return this.marketingService.addSubscriberManual(req.user.id, body);
  }

  @Post('admin/subscribers/import')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async importSubscribers(@Req() req: any, @Body() body: { emails: string[] }) {
    return this.marketingService.importSubscribers(req.user.id, body.emails);
  }

  @Delete('admin/subscribers/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async deleteSubscriber(@Param('id') id: string) {
    return this.marketingService.deleteSubscriber(id);
  }

  // Campaigns
  @Get('admin/campaigns')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getCampaigns(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.marketingService.getCampaigns(Number(page) || 1, Number(limit) || 20);
  }

  @Post('admin/campaigns')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async createCampaign(@Req() req: any, @Body() body: any) {
    return this.marketingService.createCampaign(req.user.id, body);
  }

  @Put('admin/campaigns/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async updateCampaign(@Param('id') id: string, @Body() body: any) {
    return this.marketingService.updateCampaign(id, body);
  }

  @Delete('admin/campaigns/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async deleteCampaign(@Param('id') id: string) {
    return this.marketingService.deleteCampaign(id);
  }

  @Post('admin/campaigns/:id/send')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async sendCampaign(@Req() req: any, @Param('id') id: string) {
    return this.marketingService.sendCampaign(req.user.id, id);
  }
}
