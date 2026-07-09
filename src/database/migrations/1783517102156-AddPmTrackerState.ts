import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPmTrackerState1783517102156 implements MigrationInterface {
    name = 'AddPmTrackerState1783517102156'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "memory_point_details" DROP CONSTRAINT "FK_78dffa1c1e42698341a266a5f71"`);
        await queryRunner.query(`ALTER TABLE "memory_point_ai_generations" DROP CONSTRAINT "FK_mpag_memory_point"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_mpag_did_talk_id"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_mpag_memory_point_id"`);
        await queryRunner.query(`CREATE TABLE "pm_tracker_state" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "workspace_key" character varying NOT NULL, "data" jsonb NOT NULL, CONSTRAINT "UQ_516f8ad4ca10d06a02dbb47bc45" UNIQUE ("workspace_key"), CONSTRAINT "PK_dc39461d18183a83c76a8f099a6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "memory_point_details" ALTER COLUMN "type" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "memory_point_ai_generations" ADD CONSTRAINT "UQ_89bb0701fc9f433ed30ed37ddf1" UNIQUE ("memory_point_id")`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_89bb0701fc9f433ed30ed37ddf" ON "memory_point_ai_generations" ("memory_point_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_24a93e964cfb4f5b6d2dee2e0e" ON "memory_point_ai_generations" ("did_talk_id") WHERE "did_talk_id" IS NOT NULL`);
        await queryRunner.query(`ALTER TABLE "memory_point_details" ADD CONSTRAINT "FK_78dffa1c1e42698341a266a5f71" FOREIGN KEY ("memory_point_id") REFERENCES "memory_points"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "memory_point_ai_generations" ADD CONSTRAINT "FK_89bb0701fc9f433ed30ed37ddf1" FOREIGN KEY ("memory_point_id") REFERENCES "memory_points"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "memory_point_ai_generations" DROP CONSTRAINT "FK_89bb0701fc9f433ed30ed37ddf1"`);
        await queryRunner.query(`ALTER TABLE "memory_point_details" DROP CONSTRAINT "FK_78dffa1c1e42698341a266a5f71"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_24a93e964cfb4f5b6d2dee2e0e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_89bb0701fc9f433ed30ed37ddf"`);
        await queryRunner.query(`ALTER TABLE "memory_point_ai_generations" DROP CONSTRAINT "UQ_89bb0701fc9f433ed30ed37ddf1"`);
        await queryRunner.query(`ALTER TABLE "memory_point_details" ALTER COLUMN "type" DROP NOT NULL`);
        await queryRunner.query(`DROP TABLE "pm_tracker_state"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_mpag_memory_point_id" ON "memory_point_ai_generations" ("memory_point_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_mpag_did_talk_id" ON "memory_point_ai_generations" ("did_talk_id") WHERE (did_talk_id IS NOT NULL)`);
        await queryRunner.query(`ALTER TABLE "memory_point_ai_generations" ADD CONSTRAINT "FK_mpag_memory_point" FOREIGN KEY ("memory_point_id") REFERENCES "memory_points"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "memory_point_details" ADD CONSTRAINT "FK_78dffa1c1e42698341a266a5f71" FOREIGN KEY ("memory_point_id") REFERENCES "memory_points"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
