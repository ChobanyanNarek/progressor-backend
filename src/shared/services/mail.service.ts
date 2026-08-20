import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';

import type { UserEntity } from '../../modules/user/user.entity.ts';
import type { PaymentEntity } from '../../modules/payment/entities/payment.entity.ts';

function fmt(date: Date | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function maskCard(card: string | null): string {
  if (!card) return '—';
  const clean = card.replace(/\s/g, '');
  return clean.length >= 4 ? `•••• ${clean.slice(-4)}` : card;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {}

  private get transporter() {
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
  }

  private get fromAddress(): string {
    return `ProgressOr <${this.config.get<string>('SMTP_USER') ?? 'progressor.tracker@gmail.com'}>`;
  }

  async sendVerificationCode(email: string, code: string): Promise<void> {
    const spaced = code.split('').join(' ');
    await this.transporter.sendMail({
      from: this.fromAddress,
      to: email,
      subject: `${code} is your ProgressOr verification code`,
      text: `Your verification code is: ${code}\n\nIt expires in 15 minutes.\n\nIf you did not request this, ignore this email.\n\nProgressOr team`,
      html: `
        <div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;background:#ffffff">
          <div style="padding:32px 40px 24px;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;gap:14px">
            <img src="https://progressor.work/icon-v3.png" width="36" height="36" alt="ProgressOr" style="border-radius:50%;display:block" />
            <span style="font-size:22px;font-weight:700;color:#111827;letter-spacing:-.3px">ProgressOr</span>
          </div>
          <div style="padding:36px 40px 40px">
            <p style="font-size:16px;font-weight:700;color:#111827;margin:0 0 8px">Your verification code</p>
            <p style="font-size:14px;color:#6b7280;margin:0 0 28px">Use the code below to complete your registration. It expires in <strong>15 minutes</strong>.</p>
            <div style="background:#f3f4f6;border-radius:12px;padding:28px 20px;text-align:center">
              <span style="font-size:36px;font-weight:700;color:#4f46e5;letter-spacing:12px;font-family:monospace">${spaced}</span>
            </div>
            <p style="font-size:12px;color:#9ca3af;margin:24px 0 0;text-align:center">If you did not request this code, you can safely ignore this email.</p>
          </div>
        </div>
      `,
    });
    this.logger.log(`Verification code sent to ${email}`);
  }

  async sendPaymentReceipt(payment: PaymentEntity, user: UserEntity): Promise<void> {
    try {
      const pdf = await this.buildReceiptPdf(payment, user);

      await this.transporter.sendMail({
        from: this.fromAddress,
        to: user.email,
        subject: `Your ProgressOr receipt — #${String(payment.orderId).slice(-6).toUpperCase()}`,
        text: `Hi ${[user.firstName, user.lastName].filter(Boolean).join(' ') || 'there'},\n\nThank you for subscribing to ProgressOr. Please find your receipt attached.\n\nFor support: progressor.tracker@gmail.com\n\nThe ProgressOr team`,
        attachments: [
          {
            filename: `progressor-receipt-${String(payment.orderId).slice(-6)}.pdf`,
            content: pdf,
            contentType: 'application/pdf',
          },
        ],
      });

      this.logger.log(`Receipt email sent to ${user.email} for orderId=${payment.orderId}`);
    } catch (err) {
      this.logger.error(`Failed to send receipt email to ${user.email}`, err);
    }
  }

  private buildReceiptPdf(payment: PaymentEntity, user: UserEntity): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ size: 'A4', margin: 0 });

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const W = doc.page.width;
      const gray = '#6b7280';
      const dark = '#111827';
      const white = '#ffffff';

      // Header band
      doc.rect(0, 0, W, 100).fill(dark);

      // Logo: white donut + 6 dark tick marks
      const cx = 36, cy = 50, ro = 28, ri = 20;
      doc.circle(cx, cy, ro).fill(white);
      doc.circle(cx, cy, ri).fill(dark);

      doc.strokeColor('#111827').lineWidth(2);
      for (const deg of [0, 60, 120, 180, 240, 300]) {
        const rad = (deg - 90) * (Math.PI / 180);
        doc.moveTo(cx + Math.cos(rad) * 22, cy + Math.sin(rad) * 22)
           .lineTo(cx + Math.cos(rad) * 29, cy + Math.sin(rad) * 29)
           .stroke();
      }

      doc.fillColor(white).font('Helvetica-Bold').fontSize(22).text('ProgressOr', 76, 32);
      doc.fillColor('#9ca3af').font('Helvetica').fontSize(10).text('Payment Receipt', 76, 58);
      doc.fillColor('#6b7280').fontSize(10).text('progressor.work', 76, 72);

      doc.fillColor('#9ca3af').fontSize(10).text(
        `RECEIPT #${String(payment.orderId).slice(-6).toUpperCase()}`, 0, 32, { align: 'right', width: W - 20 }
      );
      doc.fillColor('#6b7280').fontSize(10).text(
        fmt(payment.completedAt ?? payment.createdAt), 0, 48, { align: 'right', width: W - 20 }
      );

      doc.roundedRect(W - 80, 62, 60, 18, 4).fill('#22c55e');
      doc.fillColor(white).font('Helvetica-Bold').fontSize(9).text('Paid', W - 80, 68, { align: 'center', width: 60 });

      // Bill To
      let y = 130;
      doc.fillColor(gray).font('Helvetica-Bold').fontSize(9).text('BILL TO', 40, y);
      y += 16;
      const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Customer';
      doc.fillColor(dark).font('Helvetica-Bold').fontSize(13).text(fullName, 40, y);
      y += 18;
      doc.fillColor(gray).font('Helvetica').fontSize(10).text(user.email, 40, y);

      y += 28;
      doc.strokeColor('#e5e7eb').lineWidth(0.5).moveTo(40, y).lineTo(W - 40, y).stroke();
      y += 20;

      const row = (label: string, value: string) => {
        doc.fillColor(gray).font('Helvetica').fontSize(10).text(label, 40, y);
        doc.fillColor(dark).font('Helvetica-Bold').fontSize(10).text(value, 0, y, { align: 'right', width: W - 40 });
        y += 22;
      };

      row('Description', 'ProgressOr Monthly Subscription');
      row('Payment ID', (payment.paymentId ?? '').toUpperCase().slice(0, 18) || '—');
      row('Order ID', String(payment.orderId));
      row('Date', fmt(payment.completedAt ?? payment.createdAt));
      if (payment.cardNumber) row('Card', maskCard(payment.cardNumber));

      y += 8;
      doc.strokeColor('#e5e7eb').lineWidth(0.5).moveTo(40, y).lineTo(W - 40, y).stroke();
      y += 22;
      doc.fillColor(gray).font('Helvetica').fontSize(12).text('Total Paid', 40, y);
      doc.fillColor(dark).font('Helvetica-Bold').fontSize(16)
        .text(`${Number(payment.amount).toLocaleString()} ${payment.currency}`, 0, y, { align: 'right', width: W - 40 });

      const footerY = doc.page.height - 60;
      doc.strokeColor('#e5e7eb').lineWidth(0.5).moveTo(40, footerY).lineTo(W - 40, footerY).stroke();
      doc.fillColor(gray).font('Helvetica').fontSize(9)
        .text('Thank you for your subscription to ProgressOr.', 0, footerY + 12, { align: 'center', width: W });
      doc.text('For support: progressor.tracker@gmail.com', 0, footerY + 26, { align: 'center', width: W });

      doc.end();
    });
  }
}
