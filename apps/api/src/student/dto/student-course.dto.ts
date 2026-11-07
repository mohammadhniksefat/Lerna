export class StudentCourseDto {
  id!: string;
  title!: string;
  description!: string | null;
  structureType!: 'FLAT' | 'SECTION_BASED';
  status!: 'DRAFT' | 'PUBLISHED';
  createdAt!: string;
  updatedAt!: string;
}
