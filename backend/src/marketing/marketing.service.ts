import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MarketingService {
  constructor(
    private prisma: PrismaService,
    private email: EmailService,
  ) {}

  // ============================================
  // SUBSCRIPTION FORMS
  // ============================================
  async createForm(adminId: string, data: { name: string; slug?: string; title?: string; description?: string; topMessage?: string; fields?: string[]; buttonText?: string; successMsg?: string; redirectUrl?: string; requireConfirm?: boolean }) {
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const existing = await this.prisma.subscriptionForm.findUnique({ where: { slug } });
    if (existing) throw new BadRequestException('A form with this slug already exists');

    return this.prisma.subscriptionForm.create({
      data: {
        name: data.name,
        slug,
        title: data.title || 'Subscribe to Our Newsletter',
        description: data.description || 'Stay updated with the latest crypto news and exclusive offers.',
        topMessage: data.topMessage || null,
        fields: JSON.stringify(data.fields || ['email', 'firstName']),
        buttonText: data.buttonText || 'Subscribe',
        successMsg: data.successMsg || 'Thank you for subscribing! Please check your email to confirm.',
        redirectUrl: data.redirectUrl || null,
        requireConfirm: data.requireConfirm !== false,
        createdBy: adminId,
      },
    });
  }

  async updateForm(formId: string, data: any) {
    const form = await this.prisma.subscriptionForm.findUnique({ where: { id: formId } });
    if (!form) throw new NotFoundException('Form not found');

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.topMessage !== undefined) updateData.topMessage = data.topMessage || null;
    if (data.fields !== undefined) updateData.fields = JSON.stringify(data.fields);
    if (data.buttonText !== undefined) updateData.buttonText = data.buttonText;
    if (data.successMsg !== undefined) updateData.successMsg = data.successMsg;
    if (data.redirectUrl !== undefined) updateData.redirectUrl = data.redirectUrl;
    if (data.active !== undefined) updateData.active = data.active;
    if (data.requireConfirm !== undefined) updateData.requireConfirm = data.requireConfirm;
    if (data.styling !== undefined) updateData.styling = JSON.stringify(data.styling);

    return this.prisma.subscriptionForm.update({ where: { id: formId }, data: updateData });
  }

  async getForms() {
    const forms = await this.prisma.subscriptionForm.findMany({ orderBy: { createdAt: 'desc' } });
    const counts = await Promise.all(forms.map(f => this.prisma.subscriber.count({ where: { formId: f.id } })));
    return forms.map((f, i) => ({ ...f, subscriberCount: counts[i] }));
  }

  async getFormBySlug(slug: string) {
    const form = await this.prisma.subscriptionForm.findUnique({ where: { slug } });
    if (!form || !form.active) throw new NotFoundException('Form not found');
    return form;
  }

  async deleteForm(formId: string) {
    return this.prisma.subscriptionForm.delete({ where: { id: formId } });
  }

  // ============================================
  // SUBSCRIBERS
  // ============================================
  private async lookupGeo(ip?: string): Promise<{ country?: string; city?: string }> {
    if (!ip || ip === '::1' || ip === '127.0.0.1') return {};
    try {
      const cleanIp = ip.replace('::ffff:', '');
      const res = await fetch(`http://ip-api.com/json/${cleanIp}?fields=country,city,status`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success') return { country: data.country, city: data.city };
      }
    } catch {}
    return {};
  }

  async subscribe(data: { email: string; firstName?: string; lastName?: string; phone?: string; formId?: string; ipAddress?: string; userAgent?: string }) {
    const email = data.email.toLowerCase().trim();
    if (!email || !email.includes('@')) throw new BadRequestException('Invalid email');

    // Check if already subscribed to this form
    const existing = await this.prisma.subscriber.findFirst({
      where: { email, formId: data.formId || null },
    });

    if (existing) {
      if (existing.status === 'confirmed') return { message: 'Already subscribed', alreadySubscribed: true };
      if (existing.status === 'pending') return { message: 'Confirmation email already sent. Check your inbox.', alreadySubscribed: true };
    }

    const geo = await this.lookupGeo(data.ipAddress);
    const confirmToken = uuidv4();
    const subscriber = await this.prisma.subscriber.create({
      data: {
        email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        formId: data.formId || null,
        source: data.formId ? 'form' : 'manual',
        status: 'pending',
        confirmToken,
        ipAddress: data.ipAddress,
        country: geo.country,
        city: geo.city,
        userAgent: data.userAgent,
      },
    });

    // Send confirmation email
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const confirmUrl = `${frontendUrl}/subscribe/confirm?token=${confirmToken}`;
    const unsubUrl = `${frontendUrl}/unsubscribe?token=${confirmToken}`;

    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; color: #333333; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; font-size: 24px; margin: 0;">🐙 OldKraken</h1>
          <p style="color: #dbeafe; font-size: 14px; margin-top: 8px;">Confirm Your Subscription</p>
        </div>
        <div style="padding: 30px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi${data.firstName ? ` ${data.firstName}` : ''},</p>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">Thank you for your interest in OldKraken! Please confirm your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmUrl}" style="background: #3b82f6; color: #ffffff; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">Confirm Subscription</a>
          </div>
          <p style="color: #9ca3af; font-size: 12px; line-height: 1.5;">By confirming, you agree to receive emails from OldKraken. You can unsubscribe at any time.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="color: #9ca3af; font-size: 11px;">If you didn't sign up for this, simply ignore this email.</p>
          <p style="color: #9ca3af; font-size: 11px;"><a href="${unsubUrl}" style="color: #6b7280;">Unsubscribe</a></p>
        </div>
      </div>
    `;

    await this.email.sendEmail(email, 'Confirm Your Subscription — OldKraken', html, data.firstName);

    return { message: 'Confirmation email sent! Please check your inbox.', subscriberId: subscriber.id };
  }

  async confirmSubscription(token: string) {
    const subscriber = await this.prisma.subscriber.findFirst({ where: { confirmToken: token } });
    if (!subscriber) throw new NotFoundException('Invalid confirmation token');
    if (subscriber.status === 'confirmed') return { message: 'Already confirmed' };

    await this.prisma.subscriber.update({
      where: { id: subscriber.id },
      data: { status: 'confirmed', confirmedAt: new Date(), confirmToken: null },
    });

    return { message: 'Subscription confirmed! You will now receive our emails.' };
  }

  async unsubscribe(token: string) {
    // Token can be confirmToken or subscriber ID
    const subscriber = await this.prisma.subscriber.findFirst({
      where: { OR: [{ confirmToken: token }, { id: token }] },
    });
    if (!subscriber) throw new NotFoundException('Subscriber not found');

    await this.prisma.subscriber.update({
      where: { id: subscriber.id },
      data: { status: 'unsubscribed', unsubscribedAt: new Date() },
    });

    return { message: 'You have been unsubscribed.' };
  }

  async getSubscribers(page = 1, limit = 50, status?: string, formId?: string) {
    const where: any = {};
    if (status) where.status = status;
    if (formId) where.formId = formId;

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.subscriber.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      this.prisma.subscriber.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async deleteSubscriber(id: string) {
    return this.prisma.subscriber.delete({ where: { id } });
  }

  async addSubscriberManual(adminId: string, data: { email: string; firstName?: string; lastName?: string }) {
    const email = data.email.toLowerCase().trim();
    return this.prisma.subscriber.create({
      data: {
        email,
        firstName: data.firstName,
        lastName: data.lastName,
        source: 'admin',
        status: 'confirmed',
        confirmedAt: new Date(),
      },
    });
  }

  async importSubscribers(adminId: string, emails: string[]) {
    let imported = 0;
    let skipped = 0;
    for (const rawEmail of emails) {
      const email = rawEmail.toLowerCase().trim();
      if (!email || !email.includes('@')) { skipped++; continue; }
      try {
        await this.prisma.subscriber.create({
          data: { email, source: 'import', status: 'confirmed', confirmedAt: new Date() },
        });
        imported++;
      } catch {
        skipped++;
      }
    }
    return { imported, skipped, total: emails.length };
  }

  // ============================================
  // EMAIL CAMPAIGNS
  // ============================================
  async createCampaign(adminId: string, data: { name: string; subject: string; body: string; fromName?: string; targetType?: string; targetFormId?: string }) {
    return this.prisma.emailCampaign.create({
      data: {
        name: data.name,
        subject: data.subject,
        body: data.body,
        fromName: data.fromName,
        targetType: data.targetType || 'all_subscribers',
        targetFormId: data.targetFormId,
        createdBy: adminId,
      },
    });
  }

  async updateCampaign(campaignId: string, data: any) {
    return this.prisma.emailCampaign.update({ where: { id: campaignId }, data });
  }

  async getCampaigns(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.emailCampaign.findMany({ orderBy: { createdAt: 'desc' }, skip, take: limit }),
      this.prisma.emailCampaign.count(),
    ]);
    return { items, total, page, limit };
  }

  async deleteCampaign(campaignId: string) {
    return this.prisma.emailCampaign.delete({ where: { id: campaignId } });
  }

  async sendCampaign(adminId: string, campaignId: string) {
    const campaign = await this.prisma.emailCampaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    if (campaign.status === 'sent') throw new BadRequestException('Campaign already sent');

    // Get target subscribers
    const where: any = { status: 'confirmed' };
    if (campaign.targetType === 'form' && campaign.targetFormId) {
      where.formId = campaign.targetFormId;
    }

    const subscribers = await this.prisma.subscriber.findMany({ where });
    if (subscribers.length === 0) throw new BadRequestException('No confirmed subscribers to send to');

    await this.prisma.emailCampaign.update({
      where: { id: campaignId },
      data: { status: 'sending', sentAt: new Date() },
    });

    let sentCount = 0;
    let failedCount = 0;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    for (const sub of subscribers) {
      try {
        const unsubUrl = `${frontendUrl}/unsubscribe?token=${sub.id}`;
        const personalizedBody = campaign.body
          .replace(/\{\{firstName\}\}/g, sub.firstName || 'there')
          .replace(/\{\{lastName\}\}/g, sub.lastName || '')
          .replace(/\{\{email\}\}/g, sub.email);

        const html = `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; color: #333333; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 25px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 22px; margin: 0;">${campaign.fromName || '🐙 OldKraken'}</h1>
            </div>
            <div style="padding: 30px;">
              <div style="color: #374151; font-size: 14px; line-height: 1.7;">${personalizedBody}</div>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;" />
              <p style="color: #9ca3af; font-size: 11px; text-align: center;">
                You're receiving this because you subscribed to OldKraken updates.<br/>
                <a href="${unsubUrl}" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a>
              </p>
            </div>
          </div>
        `;

        const sent = await this.email.sendEmail(sub.email, campaign.subject, html, sub.firstName || undefined, adminId);
        if (sent) sentCount++; else failedCount++;

        // Small delay between emails to avoid rate limiting
        await new Promise(r => setTimeout(r, 200));
      } catch {
        failedCount++;
      }
    }

    await this.prisma.emailCampaign.update({
      where: { id: campaignId },
      data: { status: 'sent', sentCount, failedCount },
    });

    return { sentCount, failedCount, total: subscribers.length };
  }

  // ============================================
  // STATS
  // ============================================
  async getStats() {
    const [totalSubscribers, confirmed, pending, unsubscribed, totalCampaigns, totalForms] = await Promise.all([
      this.prisma.subscriber.count(),
      this.prisma.subscriber.count({ where: { status: 'confirmed' } }),
      this.prisma.subscriber.count({ where: { status: 'pending' } }),
      this.prisma.subscriber.count({ where: { status: 'unsubscribed' } }),
      this.prisma.emailCampaign.count(),
      this.prisma.subscriptionForm.count(),
    ]);
    return { totalSubscribers, confirmed, pending, unsubscribed, totalCampaigns, totalForms };
  }
}
