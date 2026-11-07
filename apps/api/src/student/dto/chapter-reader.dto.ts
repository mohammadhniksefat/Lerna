export class ChapterReaderDto {
  id!: string;
  courseId!: string | null;
  sectionId!: string | null;
  title!: string;
  content!: string;
  contentHtml!: string;
  position!: number;
  prevChapterId!: string | null;
  nextChapterId!: string | null;
}
