import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAiGeneration1780610123451 implements MigrationInterface {
  name = 'AddAiGeneration1780610123451';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."memory_point_ai_generations_status_enum" AS ENUM(
        'PENDING',
        'PROCESSING',
        'COMPLETED',
        'FAILED'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "memory_point_ai_generations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "memory_point_id" uuid NOT NULL,
        "did_talk_id" character varying,
        "status" "public"."memory_point_ai_generations_status_enum"
          NOT NULL
          DEFAULT 'PENDING',
        "result_video_url" character varying,
        "error_message" character varying,
        "user_data" character varying,
        "duration_seconds" double precision,
        "attempt_number" integer NOT NULL DEFAULT 1,

        CONSTRAINT "PK_memory_point_ai_generations"
          PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_mpag_did_talk_id"
      ON "memory_point_ai_generations" ("did_talk_id")
      WHERE "did_talk_id" IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_mpag_memory_point_id"
      ON "memory_point_ai_generations" ("memory_point_id")
    `);

    await queryRunner.query(`
      ALTER TABLE "memory_point_ai_generations"
      ADD CONSTRAINT "FK_mpag_memory_point"
      FOREIGN KEY ("memory_point_id")
      REFERENCES "memory_points"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "memory_point_ai_generations"
      DROP CONSTRAINT "FK_mpag_memory_point"
    `);

    await queryRunner.query(`
      DROP INDEX "public"."UQ_mpag_memory_point_id"
    `);

    await queryRunner.query(`
      DROP INDEX "public"."UQ_mpag_did_talk_id"
    `);

    await queryRunner.query(`
      DROP TABLE "memory_point_ai_generations"
    `);

    await queryRunner.query(`
      DROP TYPE "public"."memory_point_ai_generations_status_enum"
    `);
  }
}
