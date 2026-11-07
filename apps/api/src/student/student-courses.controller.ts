import {
  Controller,
  Get,
  Param,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { StudentCoursesService } from './student-courses.service';
import { StudentCourseDto } from './dto/student-course.dto';
import { CourseDetailsDto } from './dto/course-details.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('student/courses')
@UseGuards(JwtAuthGuard)
export class StudentCoursesController {
  constructor(private readonly studentCoursesService: StudentCoursesService) {}

  @Get()
  async findPublished(): Promise<StudentCourseDto[]> {
    return this.studentCoursesService.findPublished();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<CourseDetailsDto> {
    const course = await this.studentCoursesService.findCourseWithStructure(id);
    if (!course) {
      throw new NotFoundException(`Course with id ${id} not found`);
    }
    return course;
  }
}
