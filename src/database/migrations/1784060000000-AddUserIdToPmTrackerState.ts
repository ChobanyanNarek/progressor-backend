import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserIdToPmTrackerState1784060000000 implements MigrationInterface {
    name = 'AddUserIdToPmTrackerState1784060000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pm_tracker_state" DROP CONSTRAINT "UQ_516f8ad4ca10d06a02dbb47bc45"`);
        await queryRunner.query(`ALTER TABLE "pm_tracker_state" ALTER COLUMN "workspace_key" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "pm_tracker_state" ADD COLUMN "user_id" uuid NULL`);
        await queryRunner.query(`ALTER TABLE "pm_tracker_state" ADD CONSTRAINT "FK_pm_tracker_state_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_pm_tracker_state_user_id" ON "pm_tracker_state" ("user_id") WHERE "user_id" IS NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."UQ_pm_tracker_state_user_id"`);
        await queryRunner.query(`ALTER TABLE "pm_tracker_state" DROP CONSTRAINT "FK_pm_tracker_state_user_id"`);
        await queryRunner.query(`ALTER TABLE "pm_tracker_state" DROP COLUMN "user_id"`);
        await queryRunner.query(`ALTER TABLE "pm_tracker_state" ALTER COLUMN "workspace_key" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "pm_tracker_state" ADD CONSTRAINT "UQ_516f8ad4ca10d06a02dbb47bc45" UNIQUE ("workspace_key")`);
    }

}
