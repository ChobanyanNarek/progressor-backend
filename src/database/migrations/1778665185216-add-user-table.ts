import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserTable1778665185216 implements MigrationInterface {
  name = 'AddUserTable1778665185216';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."users_role_enum" AS ENUM(
        'CREATOR',
        'ADMIN'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."users_status_enum" AS ENUM(
        'ACTIVE',
        'DISABLED'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "first_name" character varying(50) NOT NULL,
        "last_name" character varying(50) NOT NULL,
        "role" "public"."users_role_enum" NOT NULL DEFAULT 'CREATOR',
        "email" character varying(255) NOT NULL,
        "password" character varying(255) NOT NULL,
        "status" "public"."users_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "avatar" character varying,
        "last_login" TIMESTAMP NOT NULL DEFAULT now(),

        CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3"
          UNIQUE ("email"),

        CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433"
          PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE "users"
    `);

    await queryRunner.query(`
      DROP TYPE "public"."users_status_enum"
    `);

    await queryRunner.query(`
      DROP TYPE "public"."users_role_enum"
    `);
  }
}
