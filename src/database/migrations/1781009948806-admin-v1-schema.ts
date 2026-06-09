import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Generated migration (`pnpm migration:generate`) — committed verbatim except
 * the mandatory type-only import (ADR-0001; migrations are lint-exempt).
 *
 * The `DROP INDEX IDX_*_trgm` statements are intentional and NOT redundant:
 * the `pg_trgm` GIN indexes were created by `1780942602928-add-performance-indexes`,
 * which is already merged to develop and applied to api-dev (the app runs
 * migrations on boot — `migrationsRun: true`). Per ADR-0001 we never rewrite an
 * applied migration, so the only correct way to retire an already-shipped index
 * is a new migration that drops it — this one. Going forward all indexes are
 * TypeORM-managed via entity `@Index` metadata.
 */
export class AdminV1Schema1781009948806 implements MigrationInterface {
    name = 'AdminV1Schema1781009948806'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_users_first_name_trgm"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_users_email_trgm"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_mpd_title_trgm"`);
        await queryRunner.query(`CREATE TYPE "public"."admin_log_entries_level_enum" AS ENUM('info', 'warn', 'error')`);
        await queryRunner.query(`CREATE TYPE "public"."admin_log_entries_source_enum" AS ENUM('api', 'ar', 'did', 'maps', 'auth')`);
        await queryRunner.query(`CREATE TABLE "admin_log_entries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "level" "public"."admin_log_entries_level_enum" NOT NULL, "source" "public"."admin_log_entries_source_enum" NOT NULL, "message" text NOT NULL, "memory_point_id" uuid, "context" jsonb, CONSTRAINT "PK_fb8d6870fec40bea6ab0175c9e3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0ef011637b33245553dfb3c623" ON "admin_log_entries" ("memory_point_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_8a9de58707c985db05f60193a9" ON "admin_log_entries" ("source") `);
        await queryRunner.query(`CREATE INDEX "IDX_354b90e5ce09b0760eb0f468da" ON "admin_log_entries" ("level") `);
        await queryRunner.query(`CREATE INDEX "IDX_517701f9959e1b37323d463b14" ON "admin_log_entries" ("timestamp") `);
        await queryRunner.query(`ALTER TABLE "memory_point_details" ALTER COLUMN "source_photo_url" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "memory_point_details" ALTER COLUMN "source_audio_url" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "memory_point_details" ALTER COLUMN "source_audio_url" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "memory_point_details" ALTER COLUMN "source_photo_url" SET NOT NULL`);
        await queryRunner.query(`DROP INDEX "public"."IDX_517701f9959e1b37323d463b14"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_354b90e5ce09b0760eb0f468da"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8a9de58707c985db05f60193a9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0ef011637b33245553dfb3c623"`);
        await queryRunner.query(`DROP TABLE "admin_log_entries"`);
        await queryRunner.query(`DROP TYPE "public"."admin_log_entries_source_enum"`);
        await queryRunner.query(`DROP TYPE "public"."admin_log_entries_level_enum"`);
        await queryRunner.query(`CREATE INDEX "IDX_mpd_title_trgm" ON "memory_point_details" ("title") `);
        await queryRunner.query(`CREATE INDEX "IDX_users_email_trgm" ON "users" ("email") `);
        await queryRunner.query(`CREATE INDEX "IDX_users_first_name_trgm" ON "users" ("first_name") `);
    }

}
