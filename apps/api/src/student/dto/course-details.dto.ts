export class ChapterSummaryDto {
  id!: string;
  courseId!: string | null;
  sectionId!: string | null;
  title!: string;
  position!: number;
  createdAt!: string;
  updatedAt!: string;
}

export class SectionWithChaptersDto {
  id!: string;
  courseId!: string;
  title!: string;
  position!: number;
  chapters!: ChapterSummaryDto[];
}

export class CourseDetailsDto {
  id!: string;
  title!: string;
  description!: string | null;
  structureType!: 'FLAT' | 'SECTION_BASED';
  status!: 'DRAFT' | 'PUBLISHED';
  createdAt!: string;
  updatedAt!: string;
  sections?: SectionWithChaptersDto[];
  chapters?: ChapterSummaryDto[];
}
