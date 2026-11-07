import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course, CourseStructureType, CourseStatus } from './course.entity';
import { Chapter } from './chapter.entity';
import { CreateCourseDto, UpdateCourseDto } from './dto/course.dto';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(Chapter)
    private readonly chapterRepository: Repository<Chapter>,
  ) {}

  async findAll(): Promise<Course[]> {
    return this.courseRepository.find();
  }

  async findOne(id: string): Promise<Course | null> {
    return this.courseRepository.findOne({ where: { id } });
  }

  async create(dto: CreateCourseDto): Promise<Course> {
    const course = this.courseRepository.create({
      title: dto.title,
      description: dto.description ?? null,
      structureType: dto.structureType as CourseStructureType,
      status: CourseStatus.DRAFT,
    });
    return this.courseRepository.save(course);
  }

  async update(id: string, dto: UpdateCourseDto): Promise<Course | null> {
    const course = await this.findOne(id);
    if (!course) {
      throw new NotFoundException(`Course with id ${id} not found`);
    }

    if (dto.title !== undefined) course.title = dto.title;
    if (dto.description !== undefined) course.description = dto.description ?? null;
    if (dto.structureType !== undefined) course.structureType = dto.structureType as CourseStructureType;
    if (dto.status !== undefined) course.status = dto.status as CourseStatus;

    return this.courseRepository.save(course);
  }

  async remove(id: string): Promise<void> {
    const course = await this.findOne(id);
    if (!course) {
      throw new NotFoundException(`Course with id ${id} not found`);
    }
    await this.courseRepository.remove(course);
  }

  async publish(id: string): Promise<Course> {
    const course = await this.findOne(id);
    if (!course) {
      throw new NotFoundException(`Course with id ${id} not found`);
    }

    const chapterCount = await this.chapterRepository.count({ where: { courseId: id } });
    if (chapterCount === 0) {
      throw new BadRequestException('Course must have at least one chapter before publishing');
    }

    course.status = CourseStatus.PUBLISHED;
    return this.courseRepository.save(course);
  }

  async unpublish(id: string): Promise<Course> {
    const course = await this.findOne(id);
    if (!course) {
      throw new NotFoundException(`Course with id ${id} not found`);
    }

    course.status = CourseStatus.DRAFT;
    return this.courseRepository.save(course);
  }
}