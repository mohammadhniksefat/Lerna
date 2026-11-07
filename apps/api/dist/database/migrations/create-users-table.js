"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateUsersTable1730960000000 = void 0;
class CreateUsersTable1730960000000 {
    name = 'CreateUsersTable1730960000000';
    async up(queryRunner) {
        await queryRunner.query(`CREATE TYPE "user_role" AS ENUM ('ADMIN', 'STUDENT')`);
        await queryRunner.query(`CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying(255) NOT NULL,
        "password_hash" character varying(255) NOT NULL,
        "role" "user_role" NOT NULL DEFAULT 'STUDENT',
        "created_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_users_email" ON "users" ("email")`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "IDX_users_email"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "user_role"`);
    }
}
exports.CreateUsersTable1730960000000 = CreateUsersTable1730960000000;
//# sourceMappingURL=create-users-table.js.map