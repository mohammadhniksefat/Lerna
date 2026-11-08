import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChapterProgress } from './chapter-progress.entity';
import { Chapter } from '../courses/chapter.entity';
import { Course } from '../courses/course.entity';
import {
  ProgressDto,
  CourseProgressDto,
  ResumeDto,
  ResumeChapterDto,
} from './dto/progress.dto';

@Injectable()
export class ProgressService {
  constructor(
    @InjectRepository(ChapterProgress)
    private readonly progressRepository: Repository<ChapterProgress>,
    @InjectRepository(Chapter)
    private readonly chapterRepository: Repository<Chapter>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
  ) {}

  async markComplete(
    userId: string,
    chapterId: string,
  ): Promise<ProgressDto> {
    const chapter = await this.chapterRepository.findOne({
      where: { id: chapterId },
    });

    if (!chapter) {
      throw new NotFoundException(`Chapter with id ${chapterId} not found`);
    }

    let progress = await this.progressRepository.findOne({
      where: { userId, chapterId },
    });

    if (progress && progress.isCompleted) {
      throw new ConflictException(
        `Chapter ${chapterId} is already completed for user ${userId}`,
      );
    }

    if (!progress) {
      progress = this.progressRepository.create({
        userId,
        chapterId,
        isCompleted: true,
        completedAt: new Date(),
      });
    } else {
      progress.isCompleted = true;
      progress.completedAt = new Date();
    }

    const saved = await this.progressRepository.save(progress);

    return {
      id: saved.id,
      userId: saved.userId,
      chapterId: saved.chapterId,
      isCompleted: saved.isCompleted,
      completedAt: saved.completedAt
        ? saved.completedAt.toISOString()
        : null,
      createdAt: saved.createdAt.toISOString(),
      updatedAt: saved.updatedAt.toISOString(),
    };
  }

  async getCourseProgress(
    userId: string,
    courseId: string,
  ): Promise<CourseProgressDto> {
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException(`Course with id ${courseId} not found`);
    }

    const chapters = await this.chapterRepository.find({
      where: { courseId },
    });

    const totalChapters = chapters.length;

    if (totalChapters === 0) {
      return {
        courseId,
        totalChapters: 0,
        completedChapters: 0,
        progressPercentage: 0,
      };
    }

    const chapterIds = chapters.map((c) => c.id);

    const completed = await this.progressRepository.count({
      where: {
        userId,
        chapterId: chapterIds as any,
        isCompleted: true,
      },
    });

    const progressPercentage = Math.round((completed / totalChapters) * 100);

    return {
      courseId,
      totalChapters,
      completedChapters: completed,
      progressPercentage,
    };
  }

  async getResume(userId: string): Promise<ResumeDto[]> {
    const courses = await this.courseRepository.find();

    const resumes: ResumeDto[] = [];

    for (const course of courses) {
      const chapters = await this.chapterRepository.find({
        where: { courseId: course.id },
        order: { position: 'ASC' },
      });

      if (chapters.length === 0) {
        resumes.push({
          courseId: course.id,
          courseTitle: course.title,
          progressPercentage: 0,
          nextChapter: null,
          lastCompletedChapter: null,
        });
        continue;
      }

      const chapterIds = chapters.map((c) => c.id);

      const progressRecords = await this.progressRepository.find({
        where: {
          userId,
          chapterId: chapterIds as any,
        },
      });

      const progressMap = new Map(
        progressRecords.map((p) => [p.chapterId, p]),
      );

      let completedChapters = 0;
      let lastCompleted: ResumeChapterDto | null = null;
      let nextChapter: ResumeChapterDto | null = null;

      for (const chapter of chapters) {
        const progress = progressMap.get(chapter.id);
        const isCompleted = progress ? progress.isCompleted : false;

        if (isCompleted) {
          completedChapters++;
          lastCompleted = {
            id: chapter.id,
            courseId: chapter.courseId,
            sectionId: chapter.sectionId,
            title: chapter.title,
            position: chapter.position,
            isCompleted: true,
          };
        } else if (!nextChapter) {
          nextChapter = {
            id: chapter.id,
            courseId: chapter.courseId,
            sectionId: chapter.sectionId,
            title: chapter.title,
            position: chapter.position,
            isCompleted: false,
          };
        }
      }

      const progressPercentage =
        chapters.length === 0
          ? 0
          : Math.round((completedChapters / chapters.length) * 100);

      resumes.push({
        courseId: course.id,
        courseTitle: course.title,
        progressPercentage,
        nextChapter,
        lastCompletedChapter: lastCompleted,
      });
    }

    return resumes;
  }
}
