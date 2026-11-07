import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSectionsTable1731000000001 implements MigrationInterface {
  name = 'CreateSectionsTable1731000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "sections" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "course_id" uuid NOT NULL,
        "title" character varying(255) NOT NULL,
        "position" integer NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sections" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "sections" ADD CONSTRAINT "FK_sections_course" FOREIGN KEY ("course_id") REFERENCES "courses" ("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sections" DROP CONSTRAINT "FK_sections_course"`);
    await queryRunner.query(`DROP TABLE "sections"`);
  }
}