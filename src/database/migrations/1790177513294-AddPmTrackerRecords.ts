import type { MigrationInterface, QueryRunner } from "typeorm";

/*
 * Per-record storage for pm-tracker (ADR-0018): pm_tracker_doc and pm_tracker_tombstone,
 * a revision on pm_tracker_task, migrated_at on pm_tracker_state, and the sequence every
 * revision comes from.
 *
 * Generated, then trimmed: the generator also proposed dropping pm_tracker_state's
 * user_id foreign key and partial unique index and renaming the (user_id, date) task
 * index. Those differences predate this change (the entities never declared them) and
 * are unrelated, so they are left alone. The sequence is added by hand; TypeORM does not
 * model sequences. Nothing here moves data -- each user's blob is copied on first load
 * by MigrateStateToRecordsHandler.
 */

export class AddPmTrackerRecords1790177513294 implements MigrationInterface {
    name = 'AddPmTrackerRecords1790177513294'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE SEQUENCE "pm_tracker_revision_seq" AS bigint START 1`);
        await queryRunner.query(`CREATE TABLE "pm_tracker_tombstone" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "record_id" character varying NOT NULL, "revision" bigint NOT NULL DEFAULT '0', CONSTRAINT "PK_4c4b6e54900ab5c69dbcd32febc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_pm_tracker_tombstone_user_revision" ON "pm_tracker_tombstone" ("user_id", "revision") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_pm_tracker_tombstone_user_record" ON "pm_tracker_tombstone" ("user_id", "record_id") `);
        await queryRunner.query(`CREATE TABLE "pm_tracker_doc" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "key" character varying(64) NOT NULL, "data" jsonb, "revision" bigint NOT NULL DEFAULT '0', CONSTRAINT "PK_011e93731471a1830f747894038" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_pm_tracker_doc_user_key" ON "pm_tracker_doc" ("user_id", "key") `);
        await queryRunner.query(`ALTER TABLE "pm_tracker_state" ADD "migrated_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "pm_tracker_task" ADD "revision" bigint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`CREATE INDEX "IDX_pm_tracker_task_user_revision" ON "pm_tracker_task" ("user_id", "revision") `);
    }

    // Reverting returns every user to their blob as it was when they were migrated.
    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_pm_tracker_task_user_revision"`);
        await queryRunner.query(`ALTER TABLE "pm_tracker_task" DROP COLUMN "revision"`);
        await queryRunner.query(`ALTER TABLE "pm_tracker_state" DROP COLUMN "migrated_at"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_pm_tracker_doc_user_key"`);
        await queryRunner.query(`DROP TABLE "pm_tracker_doc"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_pm_tracker_tombstone_user_record"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_pm_tracker_tombstone_user_revision"`);
        await queryRunner.query(`DROP TABLE "pm_tracker_tombstone"`);
        await queryRunner.query(`DROP SEQUENCE "pm_tracker_revision_seq"`);
    }

}
