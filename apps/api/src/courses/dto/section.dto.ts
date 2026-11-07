import { IsString, IsOptional, IsInt, MinLength } from 'class-validator';

export class SectionDto {
  id!: string;
  courseId!: string;
  title!: string;
  position!: number;
  createdAt!: string;
  updatedAt!: string;
}

export { CreateSectionDto } from './create-section.dto';
export { UpdateSectionDto } from './update-section.dto';