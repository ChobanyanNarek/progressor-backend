import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPhoneToUsers1783683702151 implements MigrationInterface {
    name = 'AddPhoneToUsers1783683702151'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "phone" character varying(30)`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_users_phone" UNIQUE ("phone")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_users_phone"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "phone"`);
    }

}
