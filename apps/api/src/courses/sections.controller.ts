import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { SectionsService } from './sections.service';
import { SectionDto } from './dto/section.dto';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('courses/:courseId/sections')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
export class SectionsController {
  constructor(private readonly sectionsService: SectionsService) {}

  @Get()
  async findAll(@Param('courseId') courseId: string): Promise<SectionDto[]> {
    const sections = await this.sectionsService.findAllByCourse(courseId);
    return sections.map(this.toDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<SectionDto> {
    const section = await this.sectionsService.findOne(id);
    if (!section) {
      throw new NotFoundException(`Section with id ${id} not found`);
    }
    return this.toDto(section);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('courseId') courseId: string,
    @Body() dto: CreateSectionDto,
  ): Promise<SectionDto> {
    const section = await this.sectionsService.create(courseId, dto);
    return this.toDto(section);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSectionDto,
  ): Promise<SectionDto> {
    const section = await this.sectionsService.update(id, dto);
    if (!section) {
      throw new NotFoundException(`Section with id ${id} not found`);
    }
    return this.toDto(section);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.sectionsService.remove(id);
  }

  @Post('reorder')
  async reorder(
    @Param('courseId') courseId: string,
    @Body() dto: { sectionIds: string[] },
  ): Promise<void> {
    await this.sectionsService.reorder(courseId, dto.sectionIds);
  }

  private toDto(section: any): SectionDto {
    return {
      id: section.id,
      courseId: section.courseId,
      title: section.title,
      position: section.position,
      createdAt: section.createdAt.toISOString(),
      updatedAt: section.updatedAt.toISOString(),
    };
  }
}