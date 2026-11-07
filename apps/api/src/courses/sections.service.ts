import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Section } from './section.entity';
import { CreateSectionDto, UpdateSectionDto } from './dto/section.dto';

@Injectable()
export class SectionsService {
  constructor(
    @InjectRepository(Section)
    private readonly sectionRepository: Repository<Section>,
  ) {}

  async findAllByCourse(courseId: string): Promise<Section[]> {
    return this.sectionRepository.find({
      where: { courseId },
      order: { position: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Section | null> {
    return this.sectionRepository.findOne({ where: { id } });
  }

  async create(courseId: string, dto: CreateSectionDto): Promise<Section> {
    const section = this.sectionRepository.create({
      courseId,
      title: dto.title,
      position: dto.position,
    });
    return this.sectionRepository.save(section);
  }

  async update(id: string, dto: UpdateSectionDto): Promise<Section | null> {
    const section = await this.findOne(id);
    if (!section) {
      throw new NotFoundException(`Section with id ${id} not found`);
    }

    if (dto.title !== undefined) section.title = dto.title;
    if (dto.position !== undefined) section.position = dto.position;

    return this.sectionRepository.save(section);
  }

  async remove(id: string): Promise<void> {
    const section = await this.findOne(id);
    if (!section) {
      throw new NotFoundException(`Section with id ${id} not found`);
    }
    await this.sectionRepository.remove(section);
  }

  async reorder(courseId: string, sectionIds: string[]): Promise<void> {
    for (let i = 0; i < sectionIds.length; i++) {
      await this.sectionRepository.update(
        { id: sectionIds[i], courseId },
        { position: i + 1 },
      );
    }
  }
}