import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMemoryPoint1778768769174 implements MigrationInterface {
  name = 'AddMemoryPoint1778768769174';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS postgis`);

    await queryRunner.query(`
      CREATE TYPE "public"."memory_point_details_type_enum" AS ENUM(
        'GRAVE',
        'MEMORIAL',
        'MONUMENT',
        'PLAQUE',
        'HERITAGE'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "memory_point_details" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "title" character varying,
        "description" character varying,
        "cloud_anchor_id" character varying,
        "source_photo_url" character varying NOT NULL,
        "source_audio_url" character varying NOT NULL,
        "video_url" character varying,
        "type" "public"."memory_point_details_type_enum",
        "memory_point_id" uuid NOT NULL,

        CONSTRAINT "REL_78dffa1c1e42698341a266a5f7"
          UNIQUE ("memory_point_id"),

        CONSTRAINT "PK_7aaa2c2bad0817f8b734d6fb673"
          PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."memory_points_status_enum" AS ENUM(
        'PENDING',
        'ADMIN_REVIEWING',
        'GENERATING',
        'AI_REVIEWING',
        'APPROVED',
        'REJECTED'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "memory_points" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "location" geography(Point,4326) NOT NULL,
        "status" "public"."memory_points_status_enum"
          NOT NULL
          DEFAULT 'PENDING',
        "user_id" uuid NOT NULL,

        CONSTRAINT "PK_77723086a18dbf271e1a1dee1cf"
          PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_0a31ddce6ce74a3aac68cbfaf6"
      ON "memory_points"
      USING GiST ("location")
    `);

    await queryRunner.query(`
      ALTER TABLE "memory_point_details"
      ADD CONSTRAINT "FK_78dffa1c1e42698341a266a5f71"
      FOREIGN KEY ("memory_point_id")
      REFERENCES "memory_points"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "memory_points"
      ADD CONSTRAINT "FK_e3f8623b69701024719f5e3b978"
      FOREIGN KEY ("user_id")
      REFERENCES "users"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "memory_points"
      DROP CONSTRAINT "FK_e3f8623b69701024719f5e3b978"
    `);

    await queryRunner.query(`
      ALTER TABLE "memory_point_details"
      DROP CONSTRAINT "FK_78dffa1c1e42698341a266a5f71"
    `);

    await queryRunner.query(`
      DROP INDEX "public"."IDX_0a31ddce6ce74a3aac68cbfaf6"
    `);

    await queryRunner.query(`
      DROP TABLE "memory_points"
    `);

    await queryRunner.query(`
      DROP TYPE "public"."memory_points_status_enum"
    `);

    await queryRunner.query(`
      DROP TABLE "memory_point_details"
    `);

    await queryRunner.query(`
      DROP TYPE "public"."memory_point_details_type_enum"
    `);

    await queryRunner.query(`DROP EXTENSION IF EXISTS postgis`);
  }
}
