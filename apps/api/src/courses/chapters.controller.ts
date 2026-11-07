import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ChaptersService } from './chapters.service';
import { ChapterDto } from './dto/chapter.dto';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('chapters')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
export class ChaptersController {
  constructor(private readonly chaptersService: ChaptersService) {}

  @Get()
  async findAll(
    @Query('courseId') courseId?: string,
    @Query('sectionId') sectionId?: string,
  ): Promise<ChapterDto[]> {
    if (courseId) {
      const chapters = await this.chaptersService.findAllByCourse(courseId);
      return chapters.map(this.toDto);
    }
    if (sectionId) {
      const chapters = await this.chaptersService.findAllBySection(sectionId);
      return chapters.map(this.toDto);
    }
    throw new NotFoundException('Either courseId or sectionId query parameter is required');
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ChapterDto> {
    const chapter = await this.chaptersService.findOne(id);
    if (!chapter) {
      throw new NotFoundException(`Chapter with id ${id} not found`);
    }
    return this.toDto(chapter);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateChapterDto): Promise<ChapterDto> {
    const chapter = await this.chaptersService.create(dto);
    return this.toDto(chapter);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateChapterDto,
  ): Promise<ChapterDto> {
    const chapter = await this.chaptersService.update(id, dto);
    if (!chapter) {
      throw new NotFoundException(`Chapter with id ${id} not found`);
    }
    return this.toDto(chapter);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.chaptersService.remove(id);
  }

  @Post('reorder')
  async reorder(
    @Body() dto: { chapterIds: string[]; courseId?: string; sectionId?: string },
  ): Promise<void> {
    if (dto.courseId) {
      await this.chaptersService.reorder(dto.courseId, null, dto.chapterIds);
    } else if (dto.sectionId) {
      await this.chaptersService.reorder(null, dto.sectionId, dto.chapterIds);
    } else {
      throw new NotFoundException('Either courseId or sectionId is required');
    }
  }

  private toDto(chapter: any): ChapterDto {
    return {
      id: chapter.id,
      courseId: chapter.courseId,
      sectionId: chapter.sectionId,
      title: chapter.title,
      content: chapter.content,
      position: chapter.position,
      createdAt: chapter.createdAt.toISOString(),
      updatedAt: chapter.updatedAt.toISOString(),
    };
  }
}