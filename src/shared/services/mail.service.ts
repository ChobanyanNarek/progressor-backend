import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';

import type { PaymentEntity } from '../../modules/payment/entities/payment.entity.ts';
import type { UserEntity } from '../../modules/user/user.entity.ts';

const LOGO_GIF = fs.readFileSync(
  // eslint-disable-next-line unicorn/prefer-import-meta-properties
  path.join(path.dirname(fileURLToPath(import.meta.url)), 'logo-wordmark.gif'),
);

function fmt(date: Date | null | undefined): string {
  if (!date) {
    return '—';
  }

  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function maskCard(card: string | null): string {
  if (!card) {
    return '—';
  }

  const clean = card.replaceAll(/\s/g, '');

  return clean.length >= 4 ? `•••• ${clean.slice(-4)}` : card;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {}

  private get transporter(): nodemailer.Transporter {
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');

    // eslint-disable-next-line sonarjs/no-clear-text-protocols
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
  }

  private get fromAddress(): string {
    return `ProgressOr <${this.config.get<string>('SMTP_USER') ?? 'progressor.tracker@gmail.com'}>`;
  }

  async sendVerificationCode(email: string, code: string): Promise<void> {
    await this.transporter.sendMail({
      from: this.fromAddress,
      to: email,
      subject: `${code} is your ProgressOr verification code`,
      text: [
        `Your verification code is: ${code}`,
        'It expires in 15 minutes.',
        'If you did not request this, ignore this email.',
        'ProgressOr team',
      ].join('\n\n'),
      html: `
        <div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;background:#ffffff">
          <div style="padding:28px 40px 20px">
            <img src="cid:logo@progressor" width="180" alt="ProgressOr" style="display:block" />
          </div>
          <div style="padding:8px 40px 40px">
            <p style="font-size:16px;font-weight:700;color:#111827;margin:0 0 8px">
              Your verification code
            </p>
            <p style="font-size:14px;color:#6b7280;margin:0 0 28px">
              Use the code below to complete your registration.
              It expires in <strong>15 minutes</strong>.
            </p>
            <div style="background:#f3f4f6;border-radius:12px;padding:24px 20px;text-align:center">
              <span style="
                font-size:28px;
                font-weight:700;
                color:#4f46e5;
                letter-spacing:10px;
                font-family:monospace
              ">${code}</span>
            </div>
            <p style="font-size:12px;color:#9ca3af;margin:24px 0 0;text-align:center">
              If you did not request this code, you can safely ignore this email.
            </p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: 'logo.gif',
          content: LOGO_GIF,
          contentType: 'image/gif',
          cid: 'logo@progressor',
        },
      ],
    });
    this.logger.log(`Verification code sent to ${email}`);
  }

  async sendSubscriptionReminder(
    email: string,
    firstName: string,
    expiresAt: Date,
  ): Promise<void> {
    const dateStr = fmt(expiresAt);
    const name = firstName || 'there';
    await this.transporter.sendMail({
      from: this.fromAddress,
      to: email,
      subject: `Your ProgressOr subscription ends tomorrow`,
      attachments: [
        {
          filename: 'logo.gif',
          content: LOGO_GIF,
          contentType: 'image/gif',
          cid: 'logo@progressor',
        },
      ],
      html: `
<div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;background:#ffffff">
  <div style="padding:28px 40px 20px;background:#ffffff">
    <img src="cid:logo@progressor" width="180" alt="ProgressOr" style="display:block" />
  </div>
  <div style="padding:0 40px 40px;background:#ffffff">
    <p style="font-size:20px;font-weight:800;color:#111827;margin:0 0 12px;line-height:1.3">
      Hi ${name}, your subscription ends tomorrow 👋
    </p>
    <p style="font-size:15px;color:#374151;margin:0 0 8px;line-height:1.6">
      Your ProgressOr subscription expires on <strong>${dateStr}</strong>.
      After that, you'll lose access to your boards and dashboards.
    </p>
    <p style="font-size:15px;color:#374151;margin:0 0 28px;line-height:1.6">
      Renew now to keep everything running without interruption.
    </p>
    <a href="https://progressor.work/billing" style="display:inline-block;padding:12px 24px;
background:#4f46e5;color:#ffffff;border-radius:8px;font-size:14px;font-weight:700;text-decoration:none">
      Renew my subscription →
    </a>
    <p style="font-size:12px;color:#9ca3af;margin:28px 0 0">
      Questions? <a href="mailto:progressor.tracker@gmail.com" style="color:#4f46e5;text-decoration:none">progressor.tracker@gmail.com</a>
    </p>
  </div>
</div>`,
    });
    this.logger.log(`Subscription reminder sent to ${email}`);
  }

  async sendPaymentReceipt(
    payment: PaymentEntity,
    user: UserEntity,
  ): Promise<void> {
    try {
      const pdf = await this.buildReceiptPdf(payment, user);

      const receiptNum = String(payment.orderId).slice(-6).toUpperCase();
      const fullName =
        [user.firstName, user.lastName].filter(Boolean).join(' ') || 'there';
      const cardLast4 = payment.cardNumber
        ? `•••• ${payment.cardNumber.replaceAll(/\s/g, '').slice(-4)}`
        : null;
      const tdL = 'style="font-size:13px;color:#6b7280;padding:6px 0"';
      const tdR =
        'style="font-size:13px;color:#111827;font-weight:600;text-align:right;padding:6px 0"';
      const tdTotalL =
        'style="font-size:15px;color:#111827;font-weight:700;padding:14px 0 6px"';
      const tdTotalR =
        'style="font-size:15px;color:#111827;font-weight:700;text-align:right;padding:14px 0 6px"';
      const cardRow = cardLast4
        ? `<tr><td ${tdL}>Card</td><td ${tdR}>${cardLast4}</td></tr>`
        : '';
      const receiptHtml = `
<div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;background:#ffffff">
  <div style="padding:28px 40px 20px;background:#ffffff">
    <img src="cid:logo@progressor" width="180" alt="ProgressOr" style="display:block" />
  </div>
  <div style="padding:0 40px 40px;background:#ffffff">
    <p style="font-size:24px;font-weight:800;color:#111827;margin:0 0 12px;line-height:1.3">
      Welcome aboard, ${fullName}! 🎉
    </p>
    <p style="font-size:15px;color:#374151;margin:0 0 8px;line-height:1.6">
      Your subscription is live and you now have full access to everything ProgressOr has to offer.
      We're genuinely excited to have you with us — thank you for your trust.
    </p>
    <p style="font-size:15px;color:#374151;margin:0 0 28px;line-height:1.6">
      Your receipt is attached below for your records.
    </p>
    <div style="background:#f9fafb;border-radius:12px;padding:24px;margin-bottom:28px">
      <table style="width:100%;border-collapse:collapse">
        <tr><td ${tdL}>Plan</td><td ${tdR}>Monthly subscription</td></tr>
        <tr><td ${tdL}>Date</td><td ${tdR}>${fmt(payment.completedAt ?? payment.createdAt)}</td></tr>
        <tr><td ${tdL}>Receipt</td><td ${tdR}>#${receiptNum}</td></tr>
        ${cardRow}
        <tr style="border-top:1px solid #e5e7eb">
          <td ${tdTotalL}>Total paid</td>
          <td ${tdTotalR}>${payment.amount.toLocaleString()} ${payment.currency}</td>
        </tr>
      </table>
    </div>
    <p style="font-size:14px;color:#374151;margin:0 0 4px">Any questions? We're always here —</p>
    <a href="mailto:progressor.tracker@gmail.com"
      style="font-size:14px;color:#4f46e5;text-decoration:none;font-weight:600">
      progressor.tracker@gmail.com
    </a>
  </div>
</div>`;

      await this.transporter.sendMail({
        from: this.fromAddress,
        to: user.email,
        subject: `You're in! Welcome to ProgressOr 🎉`,
        attachments: [
          {
            filename: 'logo.gif',
            content: LOGO_GIF,
            contentType: 'image/gif',
            cid: 'logo@progressor',
          },
          {
            filename: `progressor-receipt-${receiptNum}.pdf`,
            content: pdf,
            contentType: 'application/pdf',
          },
        ],
        html: receiptHtml,
      });

      this.logger.log(
        `Receipt email sent to ${user.email} for orderId=${payment.orderId}`,
      );
    } catch (error) {
      this.logger.error(`Failed to send receipt email to ${user.email}`, error);
    }
  }

  private buildReceiptPdf(
    payment: PaymentEntity,
    user: UserEntity,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ size: 'A4', margin: 0 });

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      doc.on('error', reject);

      const W = doc.page.width;
      const gray = '#6b7280';
      const dark = '#111827';
      const white = '#ffffff';

      // Header band
      doc.rect(0, 0, W, 100).fill(dark);

      // Logo: white donut + 6 dark tick marks
      const cx = 36;
      const cy = 50;
      doc.circle(cx, cy, 28).fill(white);
      doc.circle(cx, cy, 20).fill(dark);

      doc.strokeColor(dark).lineWidth(2);

      for (const deg of [0, 60, 120, 180, 240, 300]) {
        const rad = (deg - 90) * (Math.PI / 180);
        doc
          .moveTo(cx + Math.cos(rad) * 22, cy + Math.sin(rad) * 22)
          .lineTo(cx + Math.cos(rad) * 29, cy + Math.sin(rad) * 29)
          .stroke();
      }

      doc
        .fillColor(white)
        .font('Helvetica-Bold')
        .fontSize(22)
        .text('ProgressOr', 76, 32);
      doc
        .fillColor('#9ca3af')
        .font('Helvetica')
        .fontSize(10)
        .text('Payment Receipt', 76, 58);
      doc.fillColor('#6b7280').fontSize(10).text('progressor.work', 76, 72);

      const receiptNum = `RECEIPT #${String(payment.orderId).slice(-6).toUpperCase()}`;
      doc
        .fillColor('#9ca3af')
        .fontSize(10)
        .text(receiptNum, 0, 32, { align: 'right', width: W - 20 });
      doc
        .fillColor('#6b7280')
        .fontSize(10)
        .text(fmt(payment.completedAt ?? payment.createdAt), 0, 48, {
          align: 'right',
          width: W - 20,
        });

      doc.roundedRect(W - 80, 62, 60, 18, 4).fill('#22c55e');
      doc
        .fillColor(white)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text('Paid', W - 80, 68, { align: 'center', width: 60 });

      // Bill To
      let y = 130;
      doc
        .fillColor(gray)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text('BILL TO', 40, y);
      y += 16;
      const fullName =
        [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Customer';
      doc
        .fillColor(dark)
        .font('Helvetica-Bold')
        .fontSize(13)
        .text(fullName, 40, y);
      y += 18;
      doc
        .fillColor(gray)
        .font('Helvetica')
        .fontSize(10)
        .text(user.email, 40, y);

      y += 28;
      doc
        .strokeColor('#e5e7eb')
        .lineWidth(0.5)
        .moveTo(40, y)
        .lineTo(W - 40, y)
        .stroke();
      y += 20;

      const row = (label: string, value: string): void => {
        doc.fillColor(gray).font('Helvetica').fontSize(10).text(label, 40, y);
        doc
          .fillColor(dark)
          .font('Helvetica-Bold')
          .fontSize(10)
          .text(value, 0, y, { align: 'right', width: W - 40 });
        y += 22;
      };

      row('Description', 'ProgressOr Monthly Subscription');
      row(
        'Payment ID',
        (payment.paymentId ?? '').toUpperCase().slice(0, 18) || '—',
      );
      row('Order ID', String(payment.orderId));
      row('Date', fmt(payment.completedAt ?? payment.createdAt));

      if (payment.cardNumber) {
        row('Card', maskCard(payment.cardNumber));
      }

      y += 8;
      doc
        .strokeColor('#e5e7eb')
        .lineWidth(0.5)
        .moveTo(40, y)
        .lineTo(W - 40, y)
        .stroke();
      y += 22;
      doc
        .fillColor(gray)
        .font('Helvetica')
        .fontSize(12)
        .text('Total Paid', 40, y);
      doc
        .fillColor(dark)
        .font('Helvetica-Bold')
        .fontSize(16)
        .text(`${payment.amount.toLocaleString()} ${payment.currency}`, 0, y, {
          align: 'right',
          width: W - 40,
        });

      const footerY = doc.page.height - 60;
      doc
        .strokeColor('#e5e7eb')
        .lineWidth(0.5)
        .moveTo(40, footerY)
        .lineTo(W - 40, footerY)
        .stroke();
      doc
        .fillColor(gray)
        .font('Helvetica')
        .fontSize(9)
        .text(
          'Thank you for your subscription to ProgressOr.',
          0,
          footerY + 12,
          { align: 'center', width: W },
        );
      doc.text('For support: progressor.tracker@gmail.com', 0, footerY + 26, {
        align: 'center',
        width: W,
      });

      doc.end();
    });
  }
}
