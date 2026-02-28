import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private redis: RedisService,
  ) {}

  async register(dto: RegisterDto, ip?: string) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, parseInt(process.env.BCRYPT_ROUNDS || '12'));
    const referralCode = uuidv4().slice(0, 8).toUpperCase();

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        referralCode,
        referredBy: dto.referralCode || null,
      },
    });

    await this.prisma.loginHistory.create({
      data: { userId: user.id, ipAddress: ip || 'unknown', success: true, reason: 'Registration' },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  async login(dto: LoginDto, ip?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (!user) {
      await this.logFailedLogin(dto.email, ip, 'User not found');
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === 'FROZEN' || user.status === 'SUSPENDED') {
      await this.logFailedLogin(dto.email, ip, 'Account frozen/suspended');
      throw new UnauthorizedException('Account is suspended. Contact support.');
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      await this.logFailedLogin(dto.email, ip, 'Wrong password');
      await this.checkBruteForce(dto.email);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.twoFactorEnabled) {
      if (!dto.twoFactorCode) {
        return { requires2FA: true, message: 'Please provide 2FA code' };
      }
      const isValid2FA = authenticator.verify({ token: dto.twoFactorCode, secret: user.twoFactorSecret! });
      if (!isValid2FA) {
        await this.logFailedLogin(dto.email, ip, 'Invalid 2FA code');
        throw new UnauthorizedException('Invalid 2FA code');
      }
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: ip },
    });

    await this.prisma.loginHistory.create({
      data: { userId: user.id, ipAddress: ip || 'unknown', userAgent, success: true },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const isBlacklisted = await this.redis.exists(`blacklist:${refreshToken}`);
      if (isBlacklisted) throw new UnauthorizedException('Token revoked');

      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException('User not found');

      await this.redis.set(`blacklist:${refreshToken}`, '1', 7 * 24 * 3600);
      return this.generateTokens(user.id, user.email, user.role);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async generate2FASecret(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(user.email, process.env.TWO_FA_APP_NAME || 'OldKraken', secret);
    const qrCode = await QRCode.toDataURL(otpauthUrl);

    await this.prisma.user.update({ where: { id: userId }, data: { twoFactorSecret: secret } });
    return { secret, qrCode, otpauthUrl };
  }

  async enable2FA(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) throw new BadRequestException('2FA setup not initiated');

    const isValid = authenticator.verify({ token: code, secret: user.twoFactorSecret });
    if (!isValid) throw new BadRequestException('Invalid 2FA code');

    await this.prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: true } });
    return { message: '2FA enabled successfully' };
  }

  async disable2FA(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorEnabled) throw new BadRequestException('2FA not enabled');

    const isValid = authenticator.verify({ token: code, secret: user.twoFactorSecret! });
    if (!isValid) throw new BadRequestException('Invalid 2FA code');

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    });
    return { message: '2FA disabled successfully' };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) throw new UnauthorizedException('Current password is incorrect');

    const passwordHash = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS || '12'));
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    return { message: 'Password changed successfully' };
  }

  async logout(userId: string, token: string) {
    await this.redis.set(`blacklist:${token}`, '1', 24 * 3600);
    return { message: 'Logged out successfully' };
  }

  async verifyMagicLink(token: string, ip?: string, userAgent?: string) {
    const magicLink = await this.prisma.magicLink.findUnique({ where: { token } });
    if (!magicLink) throw new UnauthorizedException('Invalid magic link');
    if (magicLink.usedAt) throw new UnauthorizedException('Magic link already used');
    if (new Date() > magicLink.expiresAt) throw new UnauthorizedException('Magic link expired');

    const user = await this.prisma.user.findUnique({ where: { id: magicLink.userId } });
    if (!user) throw new UnauthorizedException('User not found');
    if (user.status === 'FROZEN' || user.status === 'SUSPENDED') {
      throw new UnauthorizedException('Account is suspended');
    }

    // Mark magic link as used
    await this.prisma.magicLink.update({
      where: { id: magicLink.id },
      data: { usedAt: new Date(), ipAddress: ip, userAgent },
    });

    // Update user last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: ip },
    });

    // Log the login
    await this.prisma.loginHistory.create({
      data: { userId: user.id, ipAddress: ip || 'unknown', userAgent, success: true, reason: 'Magic link login' },
    });

    return this.generateTokens(user.id, user.email, user.role);
  }

  async createMagicLink(userId: string, createdBy: string, expiresInHours: number = 24) {
    const token = uuidv4() + '-' + uuidv4();
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    await this.prisma.magicLink.create({
      data: { token, userId, createdBy, expiresAt },
    });

    const backendUrl = process.env.PLATFORM_URL || 'http://localhost:4000';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return {
      token,
      url: `${backendUrl}/api/auth/magic?token=${token}`,
      frontendUrl: `${frontendUrl}/magic-login`,
      expiresAt,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    // Always return success to prevent email enumeration
    if (!user) return { message: 'If that email is registered, a reset link has been sent.' };

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await this.redis.set(`pwd_reset:${token}`, user.id, 3600);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0e17; color: #e2e8f0; padding: 40px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 30px;"><h1 style="color: #3b82f6; font-size: 28px;">🐙 OldKraken</h1></div>
        <h2 style="color: #f1f5f9;">Password Reset Request</h2>
        <p style="color: #94a3b8; line-height: 1.6;">We received a request to reset your password. Click the button below to choose a new password. This link expires in 1 hour.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: #3b82f6; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #64748b; font-size: 12px;">If you did not request this, please ignore this email. Your password will not change.</p>
        <p style="color: #64748b; font-size: 12px; margin-top: 10px;">Link expires: ${expiresAt.toUTCString()}</p>
      </div>
    `;

    try {
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
      });
      await transporter.sendMail({
        from: `"OldKraken" <${process.env.SMTP_FROM_EMAIL || 'noreply@oldkraken.com'}>`,
        to: user.email,
        subject: 'OldKraken — Password Reset Request',
        html,
      });
    } catch (err) {
      // Email failed but we still return success (token saved in Redis)
    }

    return { message: 'If that email is registered, a reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const userId = await this.redis.get(`pwd_reset:${token}`);
    if (!userId) throw new BadRequestException('Invalid or expired reset token');

    const hash = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS || '12'));
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } });
    await this.redis.del(`pwd_reset:${token}`);

    return { message: 'Password reset successfully. You can now log in.' };
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
    });
    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: any) {
    const { passwordHash, twoFactorSecret, ...safe } = user;
    return safe;
  }

  private async logFailedLogin(email: string, ip?: string, reason?: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (user) {
      await this.prisma.loginHistory.create({
        data: { userId: user.id, ipAddress: ip || 'unknown', success: false, reason },
      });
    }
  }

  private async checkBruteForce(email: string) {
    const key = `bruteforce:${email}`;
    const attempts = await this.redis.incr(key);
    if (attempts === 1) await this.redis.expire(key, 900);
    if (attempts >= 5) {
      const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      if (user) {
        await this.prisma.user.update({ where: { id: user.id }, data: { status: 'FROZEN' } });
      }
    }
  }
}
