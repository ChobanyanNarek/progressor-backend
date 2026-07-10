import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailVerificationsTable1784100000000 implements MigrationInterface {
    name = 'AddEmailVerificationsTable1784100000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "email_verifications" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "email" character varying NOT NULL,
                "code" character varying(6) NOT NULL,
                "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_email_verifications" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_email_verifications_email" UNIQUE ("email")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "email_verifications"`);
    }
}
