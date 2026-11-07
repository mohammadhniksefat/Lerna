import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Chapter } from '../courses/chapter.entity';
import { Course, CourseStatus } from '../courses/course.entity';
import { sanitizeMarkdown } from './markdown';
import { ChapterReaderDto } from './dto/chapter-reader.dto';

@Injectable()
export class StudentChaptersService {
  constructor(
    @InjectRepository(Chapter)
    private readonly chapterRepository: Repository<Chapter>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
  ) {}

  async findChapter(id: string): Promise<ChapterReaderDto | null> {
    const chapter = await this.chapterRepository.findOne({ where: { id } });

    if (!chapter) {
      return null;
    }

    // Verify parent course is published
    const courseId = chapter.courseId;
    if (!courseId) {
      return null;
    }

    const course = await this.courseRepository.findOne({ where: { id: courseId } });
    if (!course || course.status !== CourseStatus.PUBLISHED) {
      return null;
    }

    // Scope: course for Flat, section for Section-based
    const scopeWhere = chapter.sectionId
      ? ({ sectionId: chapter.sectionId } as any)
      : ({ courseId: chapter.courseId as string, sectionId: IsNull() } as any);

    const siblings = await this.chapterRepository.find({
      where: scopeWhere,
      order: { position: 'ASC' },
    });

    const index = siblings.findIndex((c) => c.id === id);
    if (index === -1) {
      return null;
    }

    const prev = index > 0 ? siblings[index - 1] : null;
    const next = index < siblings.length - 1 ? siblings[index + 1] : null;

    return {
      id: chapter.id,
      courseId: chapter.courseId,
      sectionId: chapter.sectionId,
      title: chapter.title,
      content: chapter.content,
      contentHtml: sanitizeMarkdown(chapter.content),
      position: chapter.position,
      prevChapterId: prev?.id ?? null,
      nextChapterId: next?.id ?? null,
    };
  }
}
