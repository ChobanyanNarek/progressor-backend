import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSubscriptionAndPayments1784500000000 implements MigrationInterface {
  name = 'AddSubscriptionAndPayments1784500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add SUPER_ADMIN to role enum
    await queryRunner.query(`ALTER TYPE "public"."users_role_enum" ADD VALUE IF NOT EXISTS 'SUPER_ADMIN'`);

    // Add subscription columns to users
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "subscription_active" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "subscription_until" TIMESTAMP NULL`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "trial_until" TIMESTAMP NULL`);

    // Create payments table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "user_id" uuid NOT NULL,
        "order_id" bigint NOT NULL,
        "payment_id" character varying NULL,
        "amount" numeric(10,2) NOT NULL,
        "currency" character varying(10) NOT NULL DEFAULT 'AMD',
        "status" character varying NOT NULL DEFAULT 'pending',
        "card_number" character varying NULL,
        "card_holder_name" character varying NULL,
        "completed_at" TIMESTAMP NULL,
        "subscription_until" TIMESTAMP NULL,
        "approval_code" character varying NULL,
        "rrn" character varying NULL,
        CONSTRAINT "PK_payments" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_payments_user_id" ON "payments" ("user_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_payments_user_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payments"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "trial_until"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "subscription_until"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "subscription_active"`);
  }
}
