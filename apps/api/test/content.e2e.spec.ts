import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('Content Management E2E', () => {
  let app: NestExpressApplication;
  let adminToken: string;
  let studentToken: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Login as admin (bootstrap admin from env)
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@example.com', password: 'admin-secret' })
      .expect(200);
    adminToken = adminLogin.body.accessToken;

    // Register a student
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'student@example.com', password: 'secret1234' })
      .expect(201);

    const studentLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'student@example.com', password: 'secret1234' })
      .expect(200);
    studentToken = studentLogin.body.accessToken;
  });

  describe('Admin content management flow', () => {
    it('creates a course (DRAFT)', async () => {
      const res = await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Test Course', structureType: 'FLAT' })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.title).toBe('Test Course');
      expect(res.body.structureType).toBe('FLAT');
      expect(res.body.status).toBe('DRAFT');
      expect(res.body.description).toBeNull();
    });

    it('blocks publish on course with zero chapters', async () => {
      const course = await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Empty Course', structureType: 'FLAT' })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/courses/${course.body.id}/publish`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(409);
    });

    it('creates a chapter and then publishes course', async () => {
      const course = await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Course With Chapter', structureType: 'FLAT' })
        .expect(201);

      const chapter = await request(app.getHttpServer())
        .post('/chapters')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          courseId: course.body.id,
          title: 'Chapter 1',
          content: '# Hello World',
          position: 1,
        })
        .expect(201);

      expect(chapter.body.id).toBeDefined();
      expect(chapter.body.courseId).toBe(course.body.id);
      expect(chapter.body.sectionId).toBeNull();

      const published = await request(app.getHttpServer())
        .post(`/courses/${course.body.id}/publish`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(published.body.status).toBe('PUBLISHED');
    });

    it('lists courses', async () => {
      await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Listed Course', structureType: 'FLAT' })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get('/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('updates a course', async () => {
      const course = await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Original Title', structureType: 'FLAT' })
        .expect(201);

      const updated = await request(app.getHttpServer())
        .patch(`/courses/${course.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Updated Title', description: 'New description' })
        .expect(200);

      expect(updated.body.title).toBe('Updated Title');
      expect(updated.body.description).toBe('New description');
    });

    it('deletes a course', async () => {
      const course = await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'To Delete', structureType: 'FLAT' })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/courses/${course.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      await request(app.getHttpServer())
        .get(`/courses/${course.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('Authorization checks', () => {
    it('denies Student access to POST /courses', async () => {
      await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ title: 'Student Course', structureType: 'FLAT' })
        .expect(403);
    });

    it('denies unauthenticated access to POST /courses', async () => {
      await request(app.getHttpServer())
        .post('/courses')
        .send({ title: 'No Auth', structureType: 'FLAT' })
        .expect(401);
    });

    it('denies Student access to all content endpoints', async () => {
      const course = await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Admin Course', structureType: 'FLAT' })
        .expect(201);

      await request(app.getHttpServer())
        .get(`/courses/${course.body.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);

      await request(app.getHttpServer())
        .patch(`/courses/${course.body.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ title: 'Hack' })
        .expect(403);

      await request(app.getHttpServer())
        .delete(`/courses/${course.body.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);

      await request(app.getHttpServer())
        .post(`/courses/${course.body.id}/publish`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);

      await request(app.getHttpServer())
        .post(`/courses/${course.body.id}/unpublish`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);

      await request(app.getHttpServer())
        .post('/chapters')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ courseId: course.body.id, title: 'Ch', content: 'c', position: 1 })
        .expect(403);

      await request(app.getHttpServer())
        .post(`/courses/${course.body.id}/sections`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ title: 'Sec', position: 1 })
        .expect(403);
    });
  });

  describe('Section-based course flow', () => {
    it('creates section, chapter in section, publishes', async () => {
      const course = await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Section Course', structureType: 'SECTION_BASED' })
        .expect(201);

      const section = await request(app.getHttpServer())
        .post(`/courses/${course.body.id}/sections`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Section 1', position: 1 })
        .expect(201);

      const chapter = await request(app.getHttpServer())
        .post('/chapters')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          sectionId: section.body.id,
          title: 'Chapter in Section',
          content: '# Content',
          position: 1,
        })
        .expect(201);

      expect(chapter.body.sectionId).toBe(section.body.id);
      expect(chapter.body.courseId).toBeNull();

      const published = await request(app.getHttpServer())
        .post(`/courses/${course.body.id}/publish`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(published.body.status).toBe('PUBLISHED');
    });
  });

  describe('Reorder', () => {
    it('reorders sections', async () => {
      const course = await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Reorder Course', structureType: 'SECTION_BASED' })
        .expect(201);

      const sec1 = await request(app.getHttpServer())
        .post(`/courses/${course.body.id}/sections`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Sec 1', position: 1 })
        .expect(201);

      const sec2 = await request(app.getHttpServer())
        .post(`/courses/${course.body.id}/sections`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Sec 2', position: 2 })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/courses/${course.body.id}/sections/reorder`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ sectionIds: [sec2.body.id, sec1.body.id] })
        .expect(200);

      const sections = await request(app.getHttpServer())
        .get(`/courses/${course.body.id}/sections`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(sections.body[0].id).toBe(sec2.body.id);
      expect(sections.body[0].position).toBe(1);
      expect(sections.body[1].id).toBe(sec1.body.id);
      expect(sections.body[1].position).toBe(2);
    });

    it('reorders chapters', async () => {
      const course = await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Chapter Reorder', structureType: 'FLAT' })
        .expect(201);

      const ch1 = await request(app.getHttpServer())
        .post('/chapters')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ courseId: course.body.id, title: 'Ch 1', content: 'c', position: 1 })
        .expect(201);

      const ch2 = await request(app.getHttpServer())
        .post('/chapters')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ courseId: course.body.id, title: 'Ch 2', content: 'c', position: 2 })
        .expect(201);

      await request(app.getHttpServer())
        .post('/chapters/reorder')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ courseId: course.body.id, chapterIds: [ch2.body.id, ch1.body.id] })
        .expect(200);

      const chapters = await request(app.getHttpServer())
        .get('/chapters')
        .query({ courseId: course.body.id })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(chapters.body[0].id).toBe(ch2.body.id);
      expect(chapters.body[0].position).toBe(1);
      expect(chapters.body[1].id).toBe(ch1.body.id);
      expect(chapters.body[1].position).toBe(2);
    });
  });

  describe('Error envelope shape', () => {
    it('returns error envelope on 401', async () => {
      const res = await request(app.getHttpServer())
        .get('/courses')
        .expect(401);

      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBeDefined();
      expect(res.body.error.message).toBeDefined();
    });

    it('returns error envelope on 403', async () => {
      const res = await request(app.getHttpServer())
        .get('/courses')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);

      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBeDefined();
      expect(res.body.error.message).toBeDefined();
    });

    it('returns error envelope on 409 (publish without chapters)', async () => {
      const course = await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Empty', structureType: 'FLAT' })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post(`/courses/${course.body.id}/publish`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(409);

      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBeDefined();
      expect(res.body.error.message).toBeDefined();
    });
  });
});