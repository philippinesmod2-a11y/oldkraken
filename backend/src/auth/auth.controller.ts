import { Controller, Post, Body, UseGuards, Req, Get, HttpCode, HttpStatus, Query, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto, Enable2FADto, ChangePasswordDto, ForgotPasswordDto } from './dto/auth.dto';
import { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
    const ip = req.ip || req.headers['x-forwarded-for'] as string;
    return this.authService.register(dto, ip);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const ip = req.ip || req.headers['x-forwarded-for'] as string;
    const userAgent = req.headers['user-agent'];
    return this.authService.login(dto, ip, userAgent);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: any) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    return this.authService.logout(req.user.id, token);
  }

  @Get('2fa/generate')
  @UseGuards(AuthGuard('jwt'))
  async generate2FA(@Req() req: any) {
    return this.authService.generate2FASecret(req.user.id);
  }

  @Post('2fa/enable')
  @UseGuards(AuthGuard('jwt'))
  async enable2FA(@Req() req: any, @Body() dto: Enable2FADto) {
    return this.authService.enable2FA(req.user.id, dto.code);
  }

  @Post('2fa/disable')
  @UseGuards(AuthGuard('jwt'))
  async disable2FA(@Req() req: any, @Body() dto: Enable2FADto) {
    return this.authService.disable2FA(req.user.id, dto.code);
  }

  @Post('change-password')
  @UseGuards(AuthGuard('jwt'))
  async changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.id, dto.currentPassword, dto.newPassword);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@Req() req: any) {
    return req.user;
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: { token: string; newPassword: string }) {
    return this.authService.resetPassword(body.token, body.newPassword);
  }

  @Get('magic')
  async magicLogin(@Query('token') token: string, @Req() req: Request, @Res() res: Response) {
    const ip = req.ip || req.headers['x-forwarded-for'] as string;
    const userAgent = req.headers['user-agent'];
    try {
      const result = await this.authService.verifyMagicLink(token, ip, userAgent);
      // Redirect to frontend with tokens in URL params
      const frontendUrl = process.env.PLATFORM_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/magic-login?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`);
    } catch (error) {
      const frontendUrl = process.env.PLATFORM_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/login?error=invalid_magic_link`);
    }
  }
}
