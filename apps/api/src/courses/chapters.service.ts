import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Chapter } from './chapter.entity';
import { CreateChapterDto, UpdateChapterDto } from './dto/chapter.dto';

@Injectable()
export class ChaptersService {
  constructor(
    @InjectRepository(Chapter)
    private readonly chapterRepository: Repository<Chapter>,
  ) {}

  async findAllByCourse(courseId: string): Promise<Chapter[]> {
    return this.chapterRepository.find({
      where: { courseId, sectionId: undefined as any },
      order: { position: 'ASC' },
    });
  }

  async findAllBySection(sectionId: string): Promise<Chapter[]> {
    return this.chapterRepository.find({
      where: { sectionId },
      order: { position: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Chapter | null> {
    return this.chapterRepository.findOne({ where: { id } });
  }

  async create(dto: CreateChapterDto): Promise<Chapter> {
    const hasCourseId = dto.courseId !== undefined && dto.courseId !== null && dto.courseId !== '';
    const hasSectionId = dto.sectionId !== undefined && dto.sectionId !== null && dto.sectionId !== '';

    if (hasCourseId === hasSectionId) {
      throw new BadRequestException('Exactly one of courseId or sectionId must be provided');
    }

    const chapter = this.chapterRepository.create({
      courseId: dto.courseId ?? undefined,
      sectionId: dto.sectionId ?? undefined,
      title: dto.title,
      content: dto.content,
      position: dto.position,
    });
    return this.chapterRepository.save(chapter);
  }

  async update(id: string, dto: UpdateChapterDto): Promise<Chapter | null> {
    const chapter = await this.findOne(id);
    if (!chapter) {
      throw new NotFoundException(`Chapter with id ${id} not found`);
    }

    if (dto.title !== undefined) chapter.title = dto.title;
    if (dto.content !== undefined) chapter.content = dto.content;
    if (dto.position !== undefined) chapter.position = dto.position;

    return this.chapterRepository.save(chapter);
  }

  async remove(id: string): Promise<void> {
    const chapter = await this.findOne(id);
    if (!chapter) {
      throw new NotFoundException(`Chapter with id ${id} not found`);
    }
    await this.chapterRepository.remove(chapter);
  }

  async reorder(
    courseId: string | null,
    sectionId: string | null,
    chapterIds: string[],
  ): Promise<void> {
    for (let i = 0; i < chapterIds.length; i++) {
      const whereClause = courseId
        ? { courseId, sectionId: undefined as any, id: chapterIds[i] }
        : { sectionId: sectionId!, id: chapterIds[i] };

      await this.chapterRepository.update(
        whereClause as FindOptionsWhere<Chapter>,
        { position: i + 1 },
      );
    }
  }
}