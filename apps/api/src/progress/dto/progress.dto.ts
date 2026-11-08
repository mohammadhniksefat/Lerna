export class ProgressDto {
  id!: string;
  userId!: string;
  chapterId!: string;
  isCompleted!: boolean;
  completedAt!: string | null;
  createdAt!: string;
  updatedAt!: string;
}

export class CourseProgressDto {
  courseId!: string;
  totalChapters!: number;
  completedChapters!: number;
  progressPercentage!: number;
}

export class ResumeChapterDto {
  id!: string;
  courseId!: string | null;
  sectionId!: string | null;
  title!: string;
  position!: number;
  isCompleted!: boolean;
}

export class ResumeDto {
  courseId!: string;
  courseTitle!: string;
  progressPercentage!: number;
  nextChapter!: ResumeChapterDto | null;
  lastCompletedChapter!: ResumeChapterDto | null;
}
