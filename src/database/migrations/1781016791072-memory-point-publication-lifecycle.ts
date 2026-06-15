import type { MigrationInterface, QueryRunner } from "typeorm";

export class MemoryPointPublicationLifecycle1781016791072 implements MigrationInterface {
    name = 'MemoryPointPublicationLifecycle1781016791072'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."memory_points_publication_state_enum" AS ENUM('ACTIVE', 'INACTIVE', 'ARCHIVED')`);
        await queryRunner.query(`ALTER TABLE "memory_points" ADD "publication_state" "public"."memory_points_publication_state_enum" NOT NULL DEFAULT 'ACTIVE'`);
        await queryRunner.query(`ALTER TABLE "memory_points" ADD "deleted_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`CREATE INDEX "IDX_3836b36741fd3fc0a2d939d478" ON "memory_points" ("publication_state") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_3836b36741fd3fc0a2d939d478"`);
        await queryRunner.query(`ALTER TABLE "memory_points" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "memory_points" DROP COLUMN "publication_state"`);
        await queryRunner.query(`DROP TYPE "public"."memory_points_publication_state_enum"`);
    }

}
