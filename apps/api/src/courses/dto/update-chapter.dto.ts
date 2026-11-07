import { IsString, IsOptional, IsInt, MinLength } from 'class-validator';

export class UpdateChapterDto {
  @IsString()
  @MinLength(1)
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsInt()
  @IsOptional()
  position?: number;
}