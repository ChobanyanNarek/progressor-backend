import { Column, Entity, Index } from 'typeorm';

import { AbstractEntity } from '../../../common/abstract.entity.ts';

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

@Entity({ name: 'payments' })
@Index(['userId'])
export class PaymentEntity extends AbstractEntity {
  @Column({ type: 'uuid' })
  userId!: Uuid;

  @Column({ type: 'int' })
  orderId!: number;

  @Column({ type: 'varchar', nullable: true })
  paymentId!: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Column({ type: 'varchar', length: 10, default: 'AMD' })
  currency!: string;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status!: PaymentStatus;

  @Column({ type: 'varchar', nullable: true })
  cardNumber!: string | null;

  @Column({ type: 'varchar', nullable: true })
  cardHolderName!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  completedAt!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  subscriptionUntil!: Date | null;

  @Column({ type: 'varchar', nullable: true })
  approvalCode!: string | null;

  @Column({ type: 'varchar', nullable: true })
  rrn!: string | null;
}
