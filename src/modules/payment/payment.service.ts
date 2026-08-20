import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { MailService } from '../../shared/services/mail.service.ts';
import { UserEntity } from '../user/user.entity.ts';
import type { AdminPaymentsDto } from './dtos/admin-payments.dto.ts';
import { AdminPaymentDto } from './dtos/admin-payments.dto.ts';
import type { InitPaymentDto } from './dtos/init-payment.dto.ts';
import type { PaymentStatusDto } from './dtos/payment-status.dto.ts';
import { PaymentEntity, PaymentStatus } from './entities/payment.entity.ts';

const isTest = process.env.AMERIA_TEST === 'true';
const AMERIA_BASE_URL = isTest
  ? 'https://servicestest.ameriabank.am/VPOS'
  : 'https://services.ameriabank.am/VPOS';
const AMERIA_PAY_URL = isTest
  ? 'https://servicestest.ameriabank.am/VPOS/Payments/Pay'
  : 'https://payments.ameriabank.am/forms/frm_paymentspage.aspx';

// Monthly price in AMD
const MONTHLY_PRICE_AMD = isTest ? 10 : 100;
const SUBSCRIPTION_MONTHS = 1;

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectRepository(PaymentEntity)
    private readonly paymentRepo: Repository<PaymentEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  private get clientId(): string {
    return this.configService.get('AMERIA_CLIENT_ID') ?? '';
  }

  private get username(): string {
    return this.configService.get('AMERIA_USERNAME') ?? '';
  }

  private get password(): string {
    return this.configService.get('AMERIA_PASSWORD') ?? '';
  }

  private get backUrl(): string {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ??
      'https://progressor.vercel.app';

    return `${frontendUrl}/payment/callback`;
  }

  async initPayment(userId: Uuid): Promise<InitPaymentDto> {
    /*
     * Test env: OrderID must be 4534001–4535000; prod: use timestamp-based unique ID
     * Test env: OrderID must be in range 4534001–4535000
     * Cancel any existing pending payment for this user to free up the OrderID slot
     */
    const existingPending = await this.paymentRepo
      .createQueryBuilder('payment')
      .where('payment.userId = :userId', { userId })
      .andWhere('payment.status = :status', { status: PaymentStatus.PENDING })
      .getOne();

    if (existingPending) {
      try {
        await fetch(`${AMERIA_BASE_URL}/api/VPOS/CancelPayment`, {
          method: 'POST',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            PaymentID: existingPending.paymentId,
            Username: this.username,
            Password: this.password,
          }),
        });
      } catch {
        /* ignore cancel errors */
      }

      await this.paymentRepo.delete({ id: existingPending.id });
    }

    const orderId = isTest
      ? 4534001 + (Math.floor(Date.now() / 1000) % 999)
      : Date.now();

    const body = {
      ClientID: this.clientId,
      Username: this.username,
      Password: this.password,
      Currency: '051', // AMD
      Amount: MONTHLY_PRICE_AMD,
      OrderID: orderId,
      Description: 'ProgressOr Monthly Subscription',
      BackURL: this.backUrl,
      Timeout: 1200,
    };

    let paymentId: string;

    try {
      const res = await fetch(`${AMERIA_BASE_URL}/api/VPOS/InitPayment`, {
        method: 'POST',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as {
        PaymentID: string;
        ResponseCode: number;
        ResponseMessage: string;
      };

      if (data.ResponseCode !== 1) {
        this.logger.error(`Ameria InitPayment failed: ${data.ResponseMessage}`);

        throw new BadRequestException(
          `Payment init failed: ${data.ResponseMessage}`,
        );
      }

      paymentId = data.PaymentID;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error('Ameria InitPayment request error', error);

      throw new InternalServerErrorException('Payment gateway unavailable');
    }

    // Save pending payment record
    await this.paymentRepo.save(
      this.paymentRepo.create({
        userId,
        orderId,
        paymentId,
        amount: MONTHLY_PRICE_AMD,
        currency: 'AMD',
        status: PaymentStatus.PENDING,
      }),
    );

    const paymentUrl = `${AMERIA_PAY_URL}?id=${paymentId}&lang=en`;

    return {
      paymentUrl,
      paymentId,
      orderId: String(orderId),
    } as InitPaymentDto;
  }

  async confirmPayment(
    orderId: string,
    paymentId: string,
  ): Promise<{ ok: boolean }> {
    // Ameriabank sends paymentId in lowercase in the callback URL but DB stores uppercase
    const normalizedId = paymentId.toUpperCase();
    const payment = await this.paymentRepo
      .createQueryBuilder('payment')
      .where('payment.paymentId = :paymentId', { paymentId: normalizedId })
      .getOne();

    if (!payment) {
      this.logger.warn(
        `confirmPayment: no payment record found for paymentId=${paymentId}`,
      );

      return { ok: false };
    }

    const userId = payment.userId;
    const body = {
      PaymentID: normalizedId,
      Username: this.username,
      Password: this.password,
    };

    let details: Record<string, unknown>;

    try {
      const res = await fetch(`${AMERIA_BASE_URL}/api/VPOS/GetPaymentDetails`, {
        method: 'POST',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      details = (await res.json()) as Record<string, unknown>;
    } catch (error) {
      this.logger.error('Ameria GetPaymentDetails error', error);

      throw new InternalServerErrorException('Payment gateway unavailable');
    }

    this.logger.log(`GetPaymentDetails response: ${JSON.stringify(details)}`);

    const responseCode =
      typeof details.ResponseCode === 'string' ? details.ResponseCode : '';
    const orderStatus = Number(details.OrderStatus);

    /*
     * OrderStatus 2 = deposited/paid; ResponseCode '00' = success
     * PaymentState string also checked as fallback
     */
    const isPaid = responseCode === '00' && orderStatus === 2;

    if (!isPaid) {
      this.logger.warn(
        `Payment not confirmed: orderId=${orderId} status=${orderStatus} rc=${responseCode}`,
      );

      return { ok: false };
    }

    const now = new Date();
    const subUntil = new Date(now);
    subUntil.setMonth(subUntil.getMonth() + SUBSCRIPTION_MONTHS);

    // Update payment record
    await this.paymentRepo
      .createQueryBuilder()
      .update()
      .set({
        status: PaymentStatus.COMPLETED,
        completedAt: now,
        subscriptionUntil: subUntil,
        cardNumber: (details.CardNumber as string | null) ?? null,
        cardHolderName: (details.ClientName as string | null) ?? null,
        approvalCode: (details.ApprovalCode as string | null) ?? null,
        rrn: (details.rrn as string | null) ?? null,
      })
      .where('payment_id = :paymentId', { paymentId: normalizedId })
      .execute();

    // Activate subscription on user
    await this.userRepo
      .createQueryBuilder()
      .update()
      .set({ subscriptionActive: true, subscriptionUntil: subUntil })
      .where('id = :userId', { userId })
      .execute();

    // Send receipt email (non-blocking — failure must not break confirmation)
    const [updatedPayment, userEntity] = await Promise.all([
      this.paymentRepo
        .createQueryBuilder('payment')
        .where('payment.paymentId = :paymentId', { paymentId: normalizedId })
        .getOne(),
      this.userRepo
        .createQueryBuilder('user')
        .where('user.id = :id', { id: userId })
        .getOne(),
    ]);

    if (updatedPayment && userEntity) {
      void this.mailService.sendPaymentReceipt(updatedPayment, userEntity);
    }

    return { ok: true };
  }

  async getStatus(userId: Uuid): Promise<PaymentStatusDto> {
    const user = await this.userRepo
      .createQueryBuilder('user')
      .where('user.id = :id', { id: userId })
      .getOne();

    if (!user) {
      return {
        subscriptionActive: false,
        subscriptionUntil: null,
        trialUntil: null,
        lastPayment: null,
      } as unknown as PaymentStatusDto;
    }

    // Auto-expire subscription if past date
    let isActive = user.subscriptionActive;

    if (
      isActive &&
      user.subscriptionUntil &&
      user.subscriptionUntil < new Date()
    ) {
      isActive = false;
      await this.userRepo
        .createQueryBuilder()
        .update()
        .set({ subscriptionActive: false })
        .where('id = :userId', { userId })
        .execute();
    }

    const lastPayment = await this.paymentRepo
      .createQueryBuilder('p')
      .where('p.user_id = :userId', { userId })
      .orderBy('p.created_at', 'DESC')
      .getOne();

    return {
      subscriptionActive: isActive,
      subscriptionUntil: user.subscriptionUntil,
      trialUntil: user.trialUntil,
      lastPayment: lastPayment
        ? {
            amount: lastPayment.amount,
            currency: lastPayment.currency,
            status: lastPayment.status,
            completedAt: lastPayment.completedAt,
            cardNumber: lastPayment.cardNumber,
          }
        : null,
    } as unknown as PaymentStatusDto;
  }

  async getAdminPayments(): Promise<AdminPaymentsDto> {
    const payments = await this.paymentRepo
      .createQueryBuilder('p')
      .leftJoin(UserEntity, 'u', 'u.id = p.user_id')
      .select([
        'p.id as id',
        'p.user_id as "userId"',
        'u.email as "userEmail"',
        'CONCAT(u.first_name, \' \', u.last_name) as "userName"',
        'p.amount as amount',
        'p.currency as currency',
        'p.status as status',
        'p.payment_id as "paymentId"',
        'CAST(p.order_id AS TEXT) as "orderId"',
        'p.card_number as "cardNumber"',
        'p.created_at as "createdAt"',
        'p.completed_at as "completedAt"',
        'p.subscription_until as "subscriptionUntil"',
      ])
      .orderBy('p.created_at', 'DESC')
      .getRawMany<{
        id: string;
        userId: string;
        userEmail: string;
        userName: string;
        amount: number;
        currency: string;
        status: PaymentStatus;
        paymentId: string;
        orderId: string;
        cardNumber: string | null;
        createdAt: Date;
        completedAt: Date | null;
        subscriptionUntil: Date | null;
      }>();

    const dtos = payments.map((p) =>
      AdminPaymentDto.create({
        id: p.id as Uuid,
        userId: p.userId as Uuid,
        userEmail: p.userEmail || '',
        userName: p.userName || '',
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-conversion
        amount: Number(p.amount),
        currency: p.currency,
        status: p.status,
        paymentId: p.paymentId || '',
        orderId: p.orderId || '',
        cardNumber: p.cardNumber,
        completedAt: p.completedAt,
        subscriptionUntil: p.subscriptionUntil,
      }),
    );

    return {
      payments: dtos,
      total: dtos.length,
    } as unknown as AdminPaymentsDto;
  }

  async grantSubscription(
    userId: Uuid,
    months: number,
    days = 0,
  ): Promise<void> {
    const user = await this.userRepo
      .createQueryBuilder('user')
      .where('user.id = :id', { id: userId })
      .getOne();

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const base =
      user.subscriptionActive &&
      user.subscriptionUntil &&
      user.subscriptionUntil > new Date()
        ? user.subscriptionUntil
        : new Date();

    const subUntil = new Date(base);

    if (months > 0) {
      subUntil.setMonth(subUntil.getMonth() + months);
    }

    if (days > 0) {
      subUntil.setDate(subUntil.getDate() + days);
    }

    await this.userRepo
      .createQueryBuilder()
      .update()
      .set({ subscriptionActive: true, subscriptionUntil: subUntil })
      .where('id = :userId', { userId })
      .execute();
  }

  async revokeSubscription(userId: Uuid): Promise<void> {
    const user = await this.userRepo
      .createQueryBuilder('user')
      .where('user.id = :id', { id: userId })
      .getOne();

    if (!user) {
      throw new BadRequestException('User not found');
    }

    await this.userRepo
      .createQueryBuilder()
      .update()
      .set({ subscriptionActive: false, subscriptionUntil: null })
      .where('id = :userId', { userId })
      .execute();
  }

  getHistory(userId: Uuid): Promise<PaymentEntity[]> {
    return this.paymentRepo
      .createQueryBuilder('payment')
      .where('payment.userId = :userId', { userId })
      .orderBy('payment.createdAt', 'DESC')
      .getMany();
  }

  async refundPayment(
    paymentId: string,
    userId?: Uuid,
  ): Promise<{ ok: boolean; message?: string }> {
    const normalizedId = paymentId.toUpperCase();
    const payment = await this.paymentRepo
      .createQueryBuilder('p')
      .where('p.payment_id = :id', { id: normalizedId })
      .andWhere(userId ? 'p.user_id = :userId' : '1=1', { userId })
      .getOne();

    if (!payment) {
      throw new BadRequestException('Payment not found');
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException('Only completed payments can be refunded');
    }

    if (isTest) {
      this.logger.log(
        `CancelPayment skipped in test mode for paymentId=${normalizedId}`,
      );
    } else {
      try {
        const res = await fetch(`${AMERIA_BASE_URL}/api/VPOS/CancelPayment`, {
          method: 'POST',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            PaymentID: normalizedId,
            Username: this.username,
            Password: this.password,
          }),
        });
        const data = (await res.json()) as {
          ResponseCode?: number;
          ResponseMessage?: string;
        };
        this.logger.log(`CancelPayment response: ${JSON.stringify(data)}`);

        // Log gateway result but don't block — admin decision is authoritative
        if (data.ResponseCode !== 1) {
          this.logger.warn(
            `CancelPayment gateway rejected: ${data.ResponseMessage}`,
          );
        }
      } catch (error) {
        this.logger.error('Ameria CancelPayment error', error);
        // Continue anyway — admin explicitly requested refund
      }
    }

    await this.paymentRepo
      .createQueryBuilder()
      .update()
      .set({ status: PaymentStatus.REFUNDED })
      .where('payment_id = :id', { id: normalizedId })
      .execute();
    await this.userRepo
      .createQueryBuilder()
      .update()
      .set({ subscriptionActive: false, subscriptionUntil: null })
      .where('id = :userId', { userId: payment.userId })
      .execute();

    return { ok: true };
  }
}
