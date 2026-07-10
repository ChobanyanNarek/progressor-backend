import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

import { ApiConfigService } from './api-config.service.ts';

@Injectable()
export class ResendService {
  private readonly logger = new Logger(ResendService.name);

  private readonly client: Resend | null;

  private readonly from: string;

  constructor(private configService: ApiConfigService) {
    const apiKey = this.configService.resendApiKey;
    this.client = apiKey ? new Resend(apiKey) : null;
    this.from = this.configService.resendFromEmail;

    if (!this.client) {
      this.logger.warn('RESEND_API_KEY not set — emails will not be sent');
    }
  }

  async sendRegistrationCode(email: string, code: string): Promise<void> {
    if (!this.client) {
      this.logger.warn(`Skipping email to ${email} — Resend not configured`);

      return;
    }

    const { error } = await this.client.emails.send({
      from: this.from,
      to: email,
      subject: `${code} is your ProgressOr verification code`,
      html: `
        <div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;color:#111827">
          <div style="font-size:20px;font-weight:700;letter-spacing:-.3px;margin-bottom:8px">ProgressOr</div>
          <div style="font-size:14px;color:#6b7280;margin-bottom:32px">Workspace tracker</div>
          <div style="font-size:15px;font-weight:600;margin-bottom:12px">Your verification code</div>
          <div style="font-size:13px;color:#374151;line-height:1.6;margin-bottom:28px">
            Use the code below to complete your registration. It expires in <strong>15 minutes</strong>.
          </div>
          <div style="background:#f0f2f9;border-radius:12px;padding:28px;text-align:center;margin-bottom:28px">
            <div style="font-family:ui-monospace,monospace;font-size:36px;font-weight:700;letter-spacing:12px;color:#3b5bdb">${code}</div>
          </div>
          <div style="font-size:12px;color:#9ca3af;line-height:1.6">
            If you did not request this code, you can safely ignore this email.
          </div>
        </div>
      `,
    });

    if (error) {
      this.logger.error('Failed to send registration code email', error);
    }
  }
}
