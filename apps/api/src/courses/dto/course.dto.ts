import { CourseStructureType, CourseStatus } from '../course.entity';
import { CreateCourseDto } from './create-course.dto';
import { UpdateCourseDto } from './update-course.dto';

export { CreateCourseDto, UpdateCourseDto };

export class CourseDto {
  id!: string;
  title!: string;
  description!: string | null;
  structureType!: CourseStructureType;
  status!: CourseStatus;
  createdAt!: string;
  updatedAt!: string;
}