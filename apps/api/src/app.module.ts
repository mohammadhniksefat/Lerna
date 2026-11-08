import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { TypeormModule } from './database/typeorm.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CoursesModule } from './courses/courses.module';
import { StudentModule } from './student/student.module';
import { ProgressModule } from './progress/progress.module';

@Module({
  imports: [ConfigModule, TypeormModule, AuthModule, UsersModule, CoursesModule, StudentModule, ProgressModule],
})
export class AppModule {}
