import { Controller, Get } from '@nestjs/common';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get('public')
  async getPublicSettings() {
    return this.settingsService.getPublicSettings();
  }

  @Get('announcements')
  async getAnnouncements() {
    return this.settingsService.getAnnouncements();
  }

  @Get('stats')
  async getPlatformStats() {
    return this.settingsService.getPlatformStats();
  }
}
