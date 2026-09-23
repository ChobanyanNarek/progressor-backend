import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddPmTrackerCredential1790174342740 implements MigrationInterface {
    name = 'AddPmTrackerCredential1790174342740'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "pm_tracker_credential" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "connection_id" character varying NOT NULL, "provider" character varying(16) NOT NULL, "secret" text NOT NULL, CONSTRAINT "PK_b24c6e01357c3bd6f94915293ea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_pm_tracker_credential_user_connection" ON "pm_tracker_credential" ("user_id", "connection_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_pm_tracker_credential_user_connection"`);
        await queryRunner.query(`DROP TABLE "pm_tracker_credential"`);
    }

}
