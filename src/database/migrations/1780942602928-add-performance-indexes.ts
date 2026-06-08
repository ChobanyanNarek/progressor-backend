import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Performance indexes surfaced by the k6 load test + EXPLAIN ANALYZE:
 *  - `memory_points.created_at` removed a disk-spilling sort on the
 *    recent-points / admin list `ORDER BY created_at`.
 *  - `memory_point_details.created_at` backs the admin media list ordering.
 *  - `memory_points.status` / `users.role` back the dashboard counts and the
 *    role/status-filtered lists.
 *  - pg_trgm GIN indexes make the `ILIKE '%term%'` admin search boxes
 *    index-backed instead of sequential scans.
 *
 * The btree indexes are generated from `@Index` entity decorators; the
 * `pg_trgm` extension + `gin_trgm_ops` indexes are hand-added (they can't be
 * expressed in entity metadata) — the same documented exception as the PostGIS
 * `CREATE EXTENSION` in `1778768769174-add-memory-point`.
 */
export class AddPerformanceIndexes1780942602928 implements MigrationInterface {
  name = 'AddPerformanceIndexes1780942602928';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_fa3a31432572afbc19641e8388" ON "memory_point_details" ("created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e6b7b28010c9ed33de204737f4" ON "memory_points" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_24c93f235515ee50b8c698acfe" ON "memory_points" ("created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ace513fa30d485cfd25c11a9e4" ON "users" ("role")`,
    );

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

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_users_email_trgm"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_users_first_name_trgm"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_mpd_title_trgm"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ace513fa30d485cfd25c11a9e4"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_24c93f235515ee50b8c698acfe"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e6b7b28010c9ed33de204737f4"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fa3a31432572afbc19641e8388"`,
    );
  }
}
