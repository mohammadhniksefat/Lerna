import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateChaptersTable1731000000002 implements MigrationInterface {
  name = 'CreateChaptersTable1731000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "chapters" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "course_id" uuid,
        "section_id" uuid,
        "title" character varying(255) NOT NULL,
        "content" text NOT NULL DEFAULT '',
        "position" integer NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_chapters" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "chapters" ADD CONSTRAINT "FK_chapters_course" FOREIGN KEY ("course_id") REFERENCES "courses" ("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chapters" ADD CONSTRAINT "FK_chapters_section" FOREIGN KEY ("section_id") REFERENCES "sections" ("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chapters" ADD CONSTRAINT "chapters_parent_check" CHECK (("course_id" IS NOT NULL) = ("section_id" IS NULL))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "chapters" DROP CONSTRAINT "chapters_parent_check"`);
    await queryRunner.query(`ALTER TABLE "chapters" DROP CONSTRAINT "FK_chapters_section"`);
    await queryRunner.query(`ALTER TABLE "chapters" DROP CONSTRAINT "FK_chapters_course"`);
    await queryRunner.query(`DROP TABLE "chapters"`);
  }
}