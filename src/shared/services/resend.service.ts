import { readFileSync } from 'node:fs';

import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { createTransport, type Transporter } from 'nodemailer';

import { ApiConfigService } from './api-config.service.ts';

@Injectable()
export class ResendService {
  private static logoGif: Buffer | undefined;

  private readonly logger = new Logger(ResendService.name);

  private readonly transporter: Transporter | null;

  private readonly fromAddress: string | undefined;

  constructor(private configService: ApiConfigService) {
    ResendService.logoGif ??= readFileSync(
      new URL('../assets/logo-wordmark.gif', import.meta.url),
    );

    const user = this.configService.gmailUser;
    const pass = this.configService.gmailAppPassword;

    if (user && pass) {
      // eslint-disable-next-line sonarjs/no-clear-text-protocols
      this.transporter = createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // STARTTLS — encrypted despite secure:false
        auth: { user, pass },
      });
      this.fromAddress = user;
    } else {
      this.transporter = null;
      this.logger.warn(
        'GMAIL_USER/GMAIL_APP_PASSWORD not set — emails will not be sent',
      );
    }
  }

  async sendRegistrationCode(email: string, code: string): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(
        `Skipping email to ${email} — Gmail SMTP not configured`,
      );

      return;
    }

    try {
      await this.transporter.sendMail({
        from: `ProgressOr <${this.fromAddress}>`,
        to: email,
        subject: `${code} is your ProgressOr verification code`,
        html: [
          '<div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:48px 24px;color:#111827">',
          '  <div style="margin-bottom:32px;background:#ffffff;display:inline-block;border-radius:6px;padding:2px 0">',
          '    <img src="cid:wordmark" width="186" height="36" alt="ProgressOr" style="display:block" />',
          '  </div>',
          '  <div style="font-size:15px;font-weight:600;margin-bottom:10px">Your verification code</div>',
          '  <div style="font-size:13px;color:#374151;line-height:1.6;margin-bottom:28px">',
          '    Use the code below to complete your registration. It expires in <strong>15 minutes</strong>.',
          '  </div>',
          '  <div style="background:#f0f2f9;border-radius:12px;padding:28px;text-align:center;margin-bottom:28px">',
          `    <div style="font-family:ui-monospace,monospace;font-size:36px;font-weight:700;letter-spacing:12px;color:#3b5bdb">${code}</div>`,
          '  </div>',
          '  <div style="font-size:12px;color:#9ca3af;line-height:1.6">',
          '    If you did not request this code, you can safely ignore this email.',
          '  </div>',
          '</div>',
        ].join('\n'),
        attachments: [
          {
            filename: 'logo.gif',
            content: ResendService.logoGif!,
            cid: 'wordmark',
            contentType: 'image/gif',
          },
        ],
      });
    } catch (error) {
      this.logger.error('Failed to send registration code email', error);

      throw new InternalServerErrorException('error.emailSendFailed');
    }
  }
}
