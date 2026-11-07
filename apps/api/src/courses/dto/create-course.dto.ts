import { IsString, IsOptional, IsEnum, MinLength, MaxLength } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsString()
  @MaxLength(1000)
  @IsOptional()
  description?: string;

  @IsEnum(['FLAT', 'SECTION_BASED'])
  structureType!: 'FLAT' | 'SECTION_BASED';
}