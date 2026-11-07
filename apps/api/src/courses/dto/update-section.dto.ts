import { IsString, IsOptional, IsInt, MinLength } from 'class-validator';

export class UpdateSectionDto {
  @IsString()
  @MinLength(1)
  @IsOptional()
  title?: string;

  @IsInt()
  @IsOptional()
  position?: number;
}