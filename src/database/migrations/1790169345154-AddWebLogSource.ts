import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddWebLogSource1790169345154 implements MigrationInterface {
    name = 'AddWebLogSource1790169345154'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."admin_log_entries_source_enum" RENAME TO "admin_log_entries_source_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."admin_log_entries_source_enum" AS ENUM('api', 'ar', 'did', 'maps', 'auth', 'web')`);
        await queryRunner.query(`ALTER TABLE "admin_log_entries" ALTER COLUMN "source" TYPE "public"."admin_log_entries_source_enum" USING "source"::"text"::"public"."admin_log_entries_source_enum"`);
        await queryRunner.query(`DROP TYPE "public"."admin_log_entries_source_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."admin_log_entries_source_enum_old" AS ENUM('api', 'ar', 'did', 'maps', 'auth')`);
        await queryRunner.query(`ALTER TABLE "admin_log_entries" ALTER COLUMN "source" TYPE "public"."admin_log_entries_source_enum_old" USING "source"::"text"::"public"."admin_log_entries_source_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."admin_log_entries_source_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."admin_log_entries_source_enum_old" RENAME TO "admin_log_entries_source_enum"`);
    }

}
