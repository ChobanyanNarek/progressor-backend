import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserEntity } from '../user/user.entity.ts';
import { PaymentEntity } from './entities/payment.entity.ts';
import { PaymentController } from './payment.controller.ts';
import { PaymentService } from './payment.service.ts';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentEntity, UserEntity])],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
