import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ProgressService } from './progress.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProgressDto } from './dto/progress.dto';
import { CourseProgressDto } from './dto/progress.dto';
import { ResumeDto } from './dto/progress.dto';

type AuthedRequest = Request & { user: { id: string } };

@Controller('progress')
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get('resume')
  async getResume(@Request() req: AuthedRequest): Promise<ResumeDto[]> {
    if (!req?.user?.id) {
      throw new NotFoundException('Authenticated user not found');
    }
    return this.progressService.getResume(req.user.id);
  }

  @Post('chapters/:id/complete')
  @HttpCode(HttpStatus.CREATED)
  async markComplete(
    @Param('id') id: string,
    @Request() req: AuthedRequest,
  ): Promise<ProgressDto> {
    if (!req?.user?.id) {
      throw new NotFoundException('Authenticated user not found');
    }
    return this.progressService.markComplete(req.user.id, id);
  }

  @Get('courses/:id')
  async getCourseProgress(
    @Param('id') id: string,
    @Request() req: AuthedRequest,
  ): Promise<CourseProgressDto> {
    if (!req?.user?.id) {
      throw new NotFoundException('Authenticated user not found');
    }
    return this.progressService.getCourseProgress(req.user.id, id);
  }
}
