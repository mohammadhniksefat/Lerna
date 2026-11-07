import {
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Course, CourseStatus } from '../courses/course.entity';
import { Section } from '../courses/section.entity';
import { Chapter } from '../courses/chapter.entity';
import { StudentCourseDto } from './dto/student-course.dto';
import {
  CourseDetailsDto,
  SectionWithChaptersDto,
  ChapterSummaryDto,
} from './dto/course-details.dto';

@Injectable()
export class StudentCoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(Section)
    private readonly sectionRepository: Repository<Section>,
    @InjectRepository(Chapter)
    private readonly chapterRepository: Repository<Chapter>,
  ) {}

  async findPublished(): Promise<StudentCourseDto[]> {
    const courses = await this.courseRepository.find({
      where: { status: CourseStatus.PUBLISHED },
      order: { createdAt: 'DESC' },
    });

    return courses.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      structureType: c.structureType,
      status: c.status,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));
  }

  async findCourseWithStructure(
    id: string,
  ): Promise<CourseDetailsDto | null> {
    const course = await this.courseRepository.findOne({ where: { id } });

    if (!course || course.status !== CourseStatus.PUBLISHED) {
      return null;
    }

    const dto: CourseDetailsDto = {
      id: course.id,
      title: course.title,
      description: course.description,
      structureType: course.structureType,
      status: course.status,
      createdAt: course.createdAt.toISOString(),
      updatedAt: course.updatedAt.toISOString(),
    };

    if (course.structureType === 'SECTION_BASED') {
      const sections = await this.sectionRepository.find({
        where: { courseId: course.id },
        order: { position: 'ASC' },
      });

      dto.sections = await Promise.all(
        sections.map(async (section) => {
          const chapters = await this.chapterRepository.find({
            where: { sectionId: section.id },
            order: { position: 'ASC' },
          });

          return {
            id: section.id,
            courseId: section.courseId,
            title: section.title,
            position: section.position,
            chapters: chapters.map((ch) => ({
              id: ch.id,
              courseId: ch.courseId,
              sectionId: ch.sectionId,
              title: ch.title,
              position: ch.position,
              createdAt: ch.createdAt.toISOString(),
              updatedAt: ch.updatedAt.toISOString(),
            })),
          };
        }),
      );
    } else {
      // FLAT: chapters belong directly to the course
      const chapters = await this.chapterRepository.find({
        where: { courseId: course.id, sectionId: IsNull() },
        order: { position: 'ASC' },
      });

      dto.chapters = chapters.map((ch) => ({
        id: ch.id,
        courseId: ch.courseId,
        sectionId: ch.sectionId,
        title: ch.title,
        position: ch.position,
        createdAt: ch.createdAt.toISOString(),
        updatedAt: ch.updatedAt.toISOString(),
      }));
    }

    return dto;
  }
}
