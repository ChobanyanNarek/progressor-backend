import type { MigrationInterface, QueryRunner } from "typeorm";

// Webhook tokens for server-side sync (ADR-0019). Generated against a throwaway database.

export class AddPmTrackerHook1790182444388 implements MigrationInterface {
    name = 'AddPmTrackerHook1790182444388'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "pm_tracker_hook" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "token" character varying(64) NOT NULL, CONSTRAINT "PK_e4d58e10f26ac2dc78b39ac0826" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_pm_tracker_hook_token" ON "pm_tracker_hook" ("token") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_pm_tracker_hook_user" ON "pm_tracker_hook" ("user_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_pm_tracker_hook_user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_pm_tracker_hook_token"`);
        await queryRunner.query(`DROP TABLE "pm_tracker_hook"`);
    }

}
