import { IsString, IsOptional, IsEnum, MinLength, MaxLength } from 'class-validator';

export class UpdateCourseDto {
  @IsString()
  @MinLength(1)
  @IsOptional()
  title?: string;

  @IsString()
  @MaxLength(1000)
  @IsOptional()
  description?: string;

  @IsEnum(['FLAT', 'SECTION_BASED'])
  @IsOptional()
  structureType?: 'FLAT' | 'SECTION_BASED';

  @IsEnum(['DRAFT', 'PUBLISHED'])
  @IsOptional()
  status?: 'DRAFT' | 'PUBLISHED';
}