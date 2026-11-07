import { IsString, IsInt, MinLength } from 'class-validator';

export class CreateSectionDto {
  @IsString()
  courseId!: string;

  @IsString()
  @MinLength(1)
  title!: string;

  @IsInt()
  position!: number;
}