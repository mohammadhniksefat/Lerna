import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Course } from './course.entity';
import { Section } from './section.entity';

@Entity('chapters')
export class Chapter {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: true })
  courseId!: string | null;

  @ManyToOne(() => Course, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'course_id' })
  course!: Course | null;

  @Column({ type: 'uuid', nullable: true })
  sectionId!: string | null;

  @ManyToOne(() => Section, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'section_id' })
  section!: Section | null;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column('text')
  content!: string;

  @Column({ type: 'int' })
  position!: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;
}