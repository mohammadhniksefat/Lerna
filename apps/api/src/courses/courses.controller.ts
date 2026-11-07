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
import { CoursesService } from './courses.service';
import { CourseDto } from './dto/course.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('courses')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  async findAll(): Promise<CourseDto[]> {
    const courses = await this.coursesService.findAll();
    return courses.map(this.toDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<CourseDto> {
    const course = await this.coursesService.findOne(id);
    if (!course) {
      throw new NotFoundException(`Course with id ${id} not found`);
    }
    return this.toDto(course);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateCourseDto): Promise<CourseDto> {
    const course = await this.coursesService.create(dto);
    return this.toDto(course);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCourseDto,
  ): Promise<CourseDto> {
    const course = await this.coursesService.update(id, dto);
    if (!course) {
      throw new NotFoundException(`Course with id ${id} not found`);
    }
    return this.toDto(course);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.coursesService.remove(id);
  }

  @Post(':id/publish')
  async publish(@Param('id') id: string): Promise<CourseDto> {
    const course = await this.coursesService.publish(id);
    return this.toDto(course);
  }

  @Post(':id/unpublish')
  async unpublish(@Param('id') id: string): Promise<CourseDto> {
    const course = await this.coursesService.unpublish(id);
    return this.toDto(course);
  }

  private toDto(course: any): CourseDto {
    return {
      id: course.id,
      title: course.title,
      description: course.description,
      structureType: course.structureType,
      status: course.status,
      createdAt: course.createdAt.toISOString(),
      updatedAt: course.updatedAt.toISOString(),
    };
  }
}