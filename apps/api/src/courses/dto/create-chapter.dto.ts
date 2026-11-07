import { IsString, IsOptional, IsInt, MinLength } from 'class-validator';

export class CreateChapterDto {
  @IsOptional()
  @IsString()
  courseId?: string;

  @IsOptional()
  @IsString()
  sectionId?: string;

  @IsString()
  @MinLength(1)
  title!: string;

  @IsString()
  content!: string;

  @IsInt()
  position!: number;
}