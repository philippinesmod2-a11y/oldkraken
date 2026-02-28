import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmailService {
  private resend: Resend;
  private readonly logger = new Logger(EmailService.name);

  constructor(private prisma: PrismaService) {
    this.resend = new Resend(process.env.RESEND_API_KEY || '');
  }

  async sendEmail(to: string, subject: string, html: string, toName?: string, sentBy?: string): Promise<boolean> {
    try {
      const fromName = process.env.SMTP_FROM_NAME || 'OldKraken';
      const fromEmail = process.env.SMTP_FROM_EMAIL || 'onboarding@resend.dev';
      await this.resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: [to],
        subject,
        html,
      });

      await this.prisma.emailLog.create({
        data: {
          toEmail: to,
          toName,
          subject,
          body: html,
          status: 'sent',
          sentBy,
        },
      });

      this.logger.log(`Email sent to ${to}: ${subject}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);

      await this.prisma.emailLog.create({
        data: {
          toEmail: to,
          toName,
          subject,
          body: html,
          status: 'failed',
          sentBy,
          error: error.message,
        },
      });

      return false;
    }
  }

  async sendWelcomeEmail(email: string, name?: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0e17; color: #e2e8f0; padding: 40px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #3b82f6; font-size: 28px;">🐙 OldKraken</h1>
        </div>
        <h2 style="color: #f1f5f9;">Welcome to OldKraken${name ? `, ${name}` : ''}!</h2>
        <p style="color: #94a3b8; line-height: 1.6;">Your account has been created successfully. You can now access the full suite of trading features on our platform.</p>
        <div style="background: #1e293b; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #94a3b8; margin: 0;">Start by exploring our markets and setting up your account security with 2FA.</p>
        </div>
        <p style="color: #64748b; font-size: 12px; margin-top: 30px;">This is an automated message from OldKraken Exchange. Do not reply to this email.</p>
      </div>
    `;
    return this.sendEmail(email, 'Welcome to OldKraken Exchange', html, name);
  }

  async sendDepositApprovedEmail(email: string, coinSymbol: string, amount: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0e17; color: #e2e8f0; padding: 40px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #3b82f6; font-size: 28px;">🐙 OldKraken</h1>
        </div>
        <h2 style="color: #22c55e;">Deposit Approved ✓</h2>
        <p style="color: #94a3b8; line-height: 1.6;">Your deposit of <strong style="color: #f1f5f9;">${amount} ${coinSymbol}</strong> has been approved and credited to your account.</p>
        <p style="color: #64748b; font-size: 12px; margin-top: 30px;">OldKraken Exchange</p>
      </div>
    `;
    return this.sendEmail(email, `Deposit Approved - ${amount} ${coinSymbol}`, html);
  }

  async sendWithdrawalStatusEmail(email: string, coinSymbol: string, amount: string, status: string, reason?: string) {
    const statusColor = status === 'APPROVED' ? '#22c55e' : '#ef4444';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0e17; color: #e2e8f0; padding: 40px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #3b82f6; font-size: 28px;">🐙 OldKraken</h1>
        </div>
        <h2 style="color: ${statusColor};">Withdrawal ${status}</h2>
        <p style="color: #94a3b8; line-height: 1.6;">Your withdrawal request for <strong style="color: #f1f5f9;">${amount} ${coinSymbol}</strong> has been <strong style="color: ${statusColor};">${status.toLowerCase()}</strong>.</p>
        ${reason ? `<div style="background: #1e293b; padding: 15px; border-radius: 8px; margin: 15px 0;"><p style="color: #94a3b8; margin: 0;">Reason: ${reason}</p></div>` : ''}
        <p style="color: #64748b; font-size: 12px; margin-top: 30px;">OldKraken Exchange</p>
      </div>
    `;
    return this.sendEmail(email, `Withdrawal ${status} - ${amount} ${coinSymbol}`, html);
  }

  async sendCustomEmail(to: string, subject: string, body: string, sentBy: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0e17; color: #e2e8f0; padding: 40px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #3b82f6; font-size: 28px;">🐙 OldKraken</h1>
        </div>
        <div style="color: #94a3b8; line-height: 1.6;">${body}</div>
        <p style="color: #64748b; font-size: 12px; margin-top: 30px;">OldKraken Exchange</p>
      </div>
    `;
    return this.sendEmail(to, subject, html, undefined, sentBy);
  }

  async getEmailLogs(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.emailLog.findMany({ orderBy: { createdAt: 'desc' }, skip, take: limit }),
      this.prisma.emailLog.count(),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
