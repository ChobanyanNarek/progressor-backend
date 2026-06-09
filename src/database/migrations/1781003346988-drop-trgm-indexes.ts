import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Drops the three unmanaged `pg_trgm` GIN search indexes
 * (`add-performance-indexes`). All schema is now TypeORM-managed via entity
 * `@Index` metadata; raw expression indexes that entity metadata cannot express
 * are no longer maintained. Admin `ILIKE '%term%'` search boxes fall back to a
 * sequential scan (acceptable at admin-table scale).
 *
 * `down` recreates them faithfully (`gin_trgm_ops`), mirroring the original
 * create — TypeORM's generated reverse used a plain btree, which is wrong.
 */
export class DropTrgmIndexes1781003346988 implements MigrationInterface {
  name = 'DropTrgmIndexes1781003346988';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_mpd_title_trgm"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_users_first_name_trgm"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_users_email_trgm"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pg_trgm"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_mpd_title_trgm" ON "memory_point_details" USING gin ("title" gin_trgm_ops)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_users_first_name_trgm" ON "users" USING gin ("first_name" gin_trgm_ops)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_users_email_trgm" ON "users" USING gin ("email" gin_trgm_ops)`,
    );
  }
}
