import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChapterProgress } from './chapter-progress.entity';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';

@Module({
  imports: [TypeOrmModule.forFeature([ChapterProgress])],
  controllers: [ProgressController],
  providers: [ProgressService],
})
export class ProgressModule {}
