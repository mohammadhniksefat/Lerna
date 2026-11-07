import { IsString, IsOptional, IsInt, MinLength } from 'class-validator';

export class ChapterDto {
  id!: string;
  courseId!: string | null;
  sectionId!: string | null;
  title!: string;
  content!: string;
  position!: number;
  createdAt!: string;
  updatedAt!: string;
}

export { CreateChapterDto } from './create-chapter.dto';
export { UpdateChapterDto } from './update-chapter.dto';