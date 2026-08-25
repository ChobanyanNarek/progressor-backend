import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds pm_tracker_task, a queryable read-model mirror of the tasks array
 * inside pm_tracker_state.data (JSONB blob) — added ALONGSIDE the blob, not
 * replacing it. Existing rows are backfilled by a separate one-time script
 * (not part of this migration — see scripts/backfill-tasks.ts), run once
 * after this migration lands and before search/release-notes traffic is
 * switched to read from the new table.
 *
 * NOTE: this migration was written by hand rather than via
 * `pnpm migration:generate` (no local DB with the PostGIS-derived schema was
 * available to diff against). It only adds a new table + indexes — no
 * ALTER/rename of existing structures — so there's no ambiguity `generate`
 * would otherwise resolve. Verify with `migration:show`/a staging run before
 * merging, per the spirit of ADR-0001.
 */
export class AddPmTrackerTask1785000000000 implements MigrationInterface {
    name = 'AddPmTrackerTask1785000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "pm_tracker_task" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "client_id" character varying NOT NULL, "dev_id" character varying NOT NULL, "project_id" character varying NOT NULL, "title" character varying NOT NULL DEFAULT '', "status" character varying NOT NULL, "date" date NOT NULL, "comment" text, "jiras" jsonb NOT NULL DEFAULT '[]', "rest" jsonb NOT NULL DEFAULT '{}', CONSTRAINT "PK_pm_tracker_task_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_pm_tracker_task_user_date" ON "pm_tracker_task" ("user_id", "date")`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_pm_tracker_task_user_client" ON "pm_tracker_task" ("user_id", "client_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_pm_tracker_task_user_client"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_pm_tracker_task_user_date"`);
        await queryRunner.query(`DROP TABLE "pm_tracker_task"`);
    }

}
