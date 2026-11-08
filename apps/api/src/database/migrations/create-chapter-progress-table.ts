import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateChapterProgressTable1731000000003 implements MigrationInterface {
  name = 'CreateChapterProgressTable1731000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "chapter_progress" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "chapter_id" uuid NOT NULL,
        "is_completed" boolean NOT NULL DEFAULT false,
        "completed_at" timestamp,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_chapter_progress" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "chapter_progress" ADD CONSTRAINT "FK_chapter_progress_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chapter_progress" ADD CONSTRAINT "FK_chapter_progress_chapter" FOREIGN KEY ("chapter_id") REFERENCES "chapters" ("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_chapter_progress_user_chapter_unique" ON "chapter_progress" ("user_id", "chapter_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_chapter_progress_user_chapter_unique"`);
    await queryRunner.query(`ALTER TABLE "chapter_progress" DROP CONSTRAINT "FK_chapter_progress_chapter"`);
    await queryRunner.query(`ALTER TABLE "chapter_progress" DROP CONSTRAINT "FK_chapter_progress_user"`);
    await queryRunner.query(`DROP TABLE "chapter_progress"`);
  }
}
