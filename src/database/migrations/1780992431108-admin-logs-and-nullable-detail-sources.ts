import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Admin v1 schema changes:
 *  - `admin_log_entries` — backs `GET /admin/logs` (PRD A11 + dashboard A2):
 *    timestamped, level/source-tagged entries with an optional `context`
 *    payload and an optional `memory_point_id` so logs correlate to a point
 *    (A5 detail / A11 filter). Indexed on `timestamp` (default sort + window),
 *    `level`, `source`, and `memory_point_id`. No FK on `memory_point_id`:
 *    logs are append-only diagnostics and must survive a point deletion.
 *  - `memory_point_details.source_photo_url` / `source_audio_url` become
 *    nullable so an admin can create a metadata-only details row via
 *    `PATCH /admin/memory-points/{id}/details` before media is uploaded. The
 *    creator submission flow still validates source presence before persisting.
 */
export class AdminLogsAndNullableDetailSources1780992431108
  implements MigrationInterface
{
  name = 'AdminLogsAndNullableDetailSources1780992431108';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."admin_log_entries_level_enum" AS ENUM('info', 'warn', 'error')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."admin_log_entries_source_enum" AS ENUM('api', 'ar', 'did', 'maps', 'auth')`,
    );
    await queryRunner.query(`
      CREATE TABLE "admin_log_entries" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL,
        "level" "public"."admin_log_entries_level_enum" NOT NULL,
        "source" "public"."admin_log_entries_source_enum" NOT NULL,
        "message" text NOT NULL,
        "memory_point_id" uuid,
        "context" jsonb,
        CONSTRAINT "PK_fb8d6870fec40bea6ab0175c9e3" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_0ef011637b33245553dfb3c623" ON "admin_log_entries" ("memory_point_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8a9de58707c985db05f60193a9" ON "admin_log_entries" ("source") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_354b90e5ce09b0760eb0f468da" ON "admin_log_entries" ("level") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_517701f9959e1b37323d463b14" ON "admin_log_entries" ("timestamp") `,
    );
    await queryRunner.query(
      `ALTER TABLE "memory_point_details" ALTER COLUMN "source_photo_url" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "memory_point_details" ALTER COLUMN "source_audio_url" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "memory_point_details" ALTER COLUMN "source_audio_url" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "memory_point_details" ALTER COLUMN "source_photo_url" SET NOT NULL`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_517701f9959e1b37323d463b14"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_354b90e5ce09b0760eb0f468da"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8a9de58707c985db05f60193a9"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0ef011637b33245553dfb3c623"`,
    );
    await queryRunner.query(`DROP TABLE "admin_log_entries"`);
    await queryRunner.query(
      `DROP TYPE "public"."admin_log_entries_source_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."admin_log_entries_level_enum"`,
    );
  }
}
