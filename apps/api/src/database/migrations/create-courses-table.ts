import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCoursesTable1731000000000 implements MigrationInterface {
  name = 'CreateCoursesTable1731000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "course_structure_type" AS ENUM ('FLAT', 'SECTION_BASED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "course_status" AS ENUM ('DRAFT', 'PUBLISHED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "courses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying(255) NOT NULL,
        "description" character varying(1000),
        "structure_type" "course_structure_type" NOT NULL,
        "status" "course_status" NOT NULL DEFAULT 'DRAFT',
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_courses" PRIMARY KEY ("id")
      )`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "courses"`);
    await queryRunner.query(`DROP TYPE "course_status"`);
    await queryRunner.query(`DROP TYPE "course_structure_type"`);
  }
}