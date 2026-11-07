import {
  Controller,
  Get,
  Param,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { StudentChaptersService } from './student-chapters.service';
import { ChapterReaderDto } from './dto/chapter-reader.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('student/chapters')
@UseGuards(JwtAuthGuard)
export class StudentChaptersController {
  constructor(private readonly studentChaptersService: StudentChaptersService) {}

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ChapterReaderDto> {
    const chapter = await this.studentChaptersService.findChapter(id);
    if (!chapter) {
      throw new NotFoundException(`Chapter with id ${id} not found`);
    }
    return chapter;
  }
}
