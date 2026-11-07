import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from './course.entity';
import { Section } from './section.entity';
import { Chapter } from './chapter.entity';
import { CoursesService } from './courses.service';
import { SectionsService } from './sections.service';
import { ChaptersService } from './chapters.service';
import { CoursesController } from './courses.controller';
import { SectionsController } from './sections.controller';
import { ChaptersController } from './chapters.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Course, Section, Chapter])],
  providers: [CoursesService, SectionsService, ChaptersService],
  controllers: [CoursesController, SectionsController, ChaptersController],
  exports: [CoursesService, SectionsService, ChaptersService],
})
export class CoursesModule {}