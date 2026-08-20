import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { MailService } from '../../shared/services/mail.service.ts';
import { UserEntity } from '../user/user.entity.ts';

@Injectable()
export class SubscriptionReminderService {
  private readonly logger = new Logger(SubscriptionReminderService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly mailService: MailService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendExpiryReminders(): Promise<void> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayStart = new Date(tomorrow);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(tomorrow);
    dayEnd.setHours(23, 59, 59, 999);

    const users = await this.userRepo
      .createQueryBuilder('u')
      .where('u.subscriptionActive = true')
      .andWhere('u.subscriptionUntil >= :dayStart', { dayStart })
      .andWhere('u.subscriptionUntil <= :dayEnd', { dayEnd })
      .getMany();

    this.logger.log(
      `Subscription reminder: ${users.length} user(s) expiring tomorrow`,
    );

    await Promise.allSettled(
      users.map(async (user) => {
        try {
          await this.mailService.sendSubscriptionReminder(
            user.email,
            user.firstName || '',
            user.subscriptionUntil!,
          );
        } catch (error) {
          this.logger.error(`Failed to send reminder to ${user.email}`, error);
        }
      }),
    );
  }
}
