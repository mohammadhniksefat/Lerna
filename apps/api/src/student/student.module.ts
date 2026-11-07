import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from '../courses/course.entity';
import { Section } from '../courses/section.entity';
import { Chapter } from '../courses/chapter.entity';
import { StudentCoursesController } from './student-courses.controller';
import { StudentChaptersController } from './student-chapters.controller';
import { StudentCoursesService } from './student-courses.service';
import { StudentChaptersService } from './student-chapters.service';

@Module({
  imports: [TypeOrmModule.forFeature([Course, Section, Chapter])],
  controllers: [StudentCoursesController, StudentChaptersController],
  providers: [StudentCoursesService, StudentChaptersService],
})
export class StudentModule {}
