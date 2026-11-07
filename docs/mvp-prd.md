# Product Requirements Document (PRD)

## Minimal Learning Management Platform (MVP)

**Version:** 1.0  
**Status:** Initial Draft  
**Product Type:** Web-based Learning Management System

---

## 1. Product Overview

### 1.1 Description

The product is a web-based learning platform designed to create, organize, publish, and consume text-based educational courses.

The platform provides two primary interfaces:

- **Student Panel:** Allows users to browse available courses, read educational content, and track their learning progress.
    
- **Admin Panel:** Allows administrators to create and manage courses, organize their content, and publish educational materials.
    

Educational content is written and stored in Markdown format. Students consume the content through a rendered reading interface, while administrators manage it through a simple Markdown text editor.

### 1.2 Product Vision

Provide a simple and structured environment for delivering text-based educational content and tracking individual learning progress.

### 1.3 MVP Objectives

The MVP focuses on four core capabilities:

1. Creating and managing educational courses.
    
2. Organizing course content into chapters and sections.
    
3. Providing a structured reading experience for students.
    
4. Tracking individual learning progress.
    

Features outside these objectives are excluded from the initial release.

---

## 2. User Roles

The system supports two user roles.

### 2.1 Admin

Administrators are responsible for managing educational content.

Admin capabilities:

- Create, edit, and delete courses.
    
- Publish and unpublish courses.
    
- Create, edit, and delete sections.
    
- Create, edit, and delete chapters.
    
- Manage the ordering of sections and chapters.
    
- Write and edit Markdown content.
    

The MVP supports a single administrative role without configurable permission levels.

### 2.2 Student

Students are the consumers of educational content.

Student capabilities:

- Register and log in.
    
- Browse published courses.
    
- View course details and content structure.
    
- Read chapter content.
    
- Navigate between chapters.
    
- Mark chapters as completed.
    
- View individual course progress.
    
- Resume previously started courses.
    

---

## 3. Content Structure

### 3.1 Course Hierarchy

Each course supports one of two content structures.

#### Flat Structure

In this structure, chapters belong directly to the course.

```
Course
 ├── Chapter 1
 ├── Chapter 2
 ├── Chapter 3
 └── Chapter 4
```

#### Section-based Structure

In this structure, chapters are organized into sections.

```
Course
 ├── Section 1
 │    ├── Chapter 1
 │    └── Chapter 2
 │
 ├── Section 2
 │    ├── Chapter 3
 │    └── Chapter 4
 │
 └── Section 3
      └── Chapter 5
```

### 3.2 Structural Rules

- Every course must contain at least one chapter before publication.
    
- Sections are optional.
    
- A course must use either Flat or Section-based structure.
    
- A course cannot simultaneously contain direct chapters and sections.
    
- Each chapter must belong to exactly one course or one section.
    
- Sections cannot contain nested sections.
    
- Each section must belong to exactly one course.
    
- Sections and chapters must have an explicit display order.
    
- Chapter ordering is managed within its parent course or section.
    

### 3.3 Content Format

All educational chapter content is stored as raw Markdown.

The student interface must render Markdown into readable HTML.

The following Markdown elements must be supported:

- Headings
    
- Paragraphs
    
- Bold and Italic text
    
- Ordered and Unordered Lists
    
- Links
    
- Blockquotes
    
- Inline Code
    
- Code Blocks
    
- Tables
    

Rendered content must be sanitized to prevent Cross-Site Scripting (XSS) vulnerabilities.

---

## 4. Functional Requirements

### 4.1 Authentication and Authorization

**FR-AUTH-01 — Registration**

The system must allow users to create new accounts.

Newly registered accounts must automatically receive the `Student` role.

Users must not be able to assign themselves administrative privileges.

**FR-AUTH-02 — Login**

Registered users must be able to authenticate using their account credentials.

**FR-AUTH-03 — Logout**

Authenticated users must be able to terminate their sessions.

**FR-AUTH-04 — Role-based Access Control**

Administrative operations must only be accessible to authenticated Admin users.

Student users must not be able to execute administrative operations through direct API requests.

**FR-AUTH-05 — Admin Provisioning**

The initial Admin account must be created through a secure provisioning process rather than public registration.

### 4.2 Course Management

**FR-COURSE-01 — Create Course**

Admin must be able to create a course.

Course information includes:

|Field|Description|
|---|---|
|Title|Course title|
|Description|Short course description|
|Structure Type|Flat or Section-based|
|Status|Draft or Published|
|Created At|Creation timestamp|
|Updated At|Last modification timestamp|

**FR-COURSE-02 — Edit Course**

Admin must be able to modify course information.

**FR-COURSE-03 — Delete Course**

Admin must be able to delete a course.

Deleting a course must also delete its associated sections, chapters, and student progress records.

**FR-COURSE-04 — Publish Course**

Admin must be able to publish a course.

A course must contain at least one chapter before it can be published.

Only published courses are accessible to students.

**FR-COURSE-05 — Unpublish Course**

Admin must be able to change a published course back to Draft.

Unpublishing a course must not delete existing student progress records.

### 4.3 Section Management

**FR-SECTION-01 — Create Section**

Admin must be able to create sections within a Section-based course.

**FR-SECTION-02 — Edit Section**

Admin must be able to modify section titles.

**FR-SECTION-03 — Delete Section**

Admin must be able to delete sections.

Deleting a section must also delete its associated chapters and their progress records.

**FR-SECTION-04 — Reorder Sections**

Admin must be able to change the display order of sections.

### 4.4 Chapter Management

**FR-CHAPTER-01 — Create Chapter**

Admin must be able to create chapters within a course.

Chapter information includes:

|Field|Description|
|---|---|
|Title|Chapter title|
|Content|Raw Markdown content|
|Course ID|Parent course, when directly associated|
|Section ID|Parent section, when section-associated|
|Position|Display order|
|Created At|Creation timestamp|
|Updated At|Last modification timestamp|

**FR-CHAPTER-02 — Edit Chapter**

Admin must be able to modify chapter titles and Markdown content.

**FR-CHAPTER-03 — Delete Chapter**

Admin must be able to delete chapters.

Deleting a chapter must also delete all associated student progress records.

**FR-CHAPTER-04 — Reorder Chapters**

Admin must be able to change chapter ordering.

Chapter ordering must be managed within its parent scope:

- Course level for Flat courses.
    
- Section level for Section-based courses.
    

### 4.5 Student Learning Experience

**FR-STUDENT-01 — Course Listing**

Students must be able to browse all published courses.

Draft courses must not be visible to students.

**FR-STUDENT-02 — Course Details**

Students must be able to view course information and its content structure.

**FR-STUDENT-03 — Chapter Navigation**

Students must be able to:

- Browse the course chapter list.
    
- Select and open individual chapters.
    
- Navigate to the previous chapter.
    
- Navigate to the next chapter.
    
- Navigate between chapters using the course content list.
    

**FR-STUDENT-04 — Markdown Rendering**

Chapter content must be rendered into readable HTML.

**FR-STUDENT-05 — Mark as Completed**

Students must be able to manually mark a chapter as completed using a `Mark as Completed` action.

**FR-STUDENT-06 — Progress Display**

Students must be able to view their course completion percentage.

Chapter completion status must also be visible in the course content navigation.

**FR-STUDENT-07 — Resume Learning**

Students must be able to revisit previously started courses and access their existing progress.

The system should provide access to the last visited chapter when available.

### 4.6 Progress Tracking

Progress is tracked at the chapter level.

Each student has an independent completion status for each chapter.

#### Progress Data

Each progress record contains:

|Field|Description|
|---|---|
|User ID|Student identifier|
|Chapter ID|Associated chapter|
|Is Completed|Completion status|
|Completed At|Completion timestamp|

#### Progress Calculation

Course progress is calculated using the following formula:

[  
Progress =  
\frac{Completed\ Chapters}{Total\ Chapters}  
\times 100  
]

For example, if a course contains 8 chapters and a student has completed 3:

[  
Progress = \frac{3}{8} \times 100 = 37.5%  
]

#### Progress Rules

- Progress is independent for each student.
    
- Each student can have only one progress record per chapter.
    
- The combination of `User ID` and `Chapter ID` must be unique.
    
- Progress must persist across login sessions.
    
- Adding a new chapter must automatically affect the calculated progress.
    
- Deleting a chapter must delete its associated progress records.
    
- Unpublishing a course must preserve student progress.
    
- Course progress must be calculated from its associated chapters.
    
- A course with no chapters has a progress value of zero.
    

Course progress percentages do not need to be stored independently. They should be calculated from chapter completion records.

---

## 5. User Flows

### 5.1 Admin — Create and Publish a Course

```
Admin Login
    ↓
Admin Dashboard
    ↓
Create Course
    ↓
Enter Course Information
    ↓
Select Content Structure
    ├── Flat
    │     └── Create Chapters
    │
    └── Section-based
          └── Create Sections
                └── Create Chapters
    ↓
Publish Course
    ↓
Course Available to Students
```

### 5.2 Student — Study a Course

```
Student Registration / Login
    ↓
Course Listing
    ↓
Select Course
    ↓
View Course Structure
    ↓
Select Chapter
    ↓
Read Markdown Content
    ↓
Mark as Completed
    ↓
Progress Updated
    ↓
Navigate to Next Chapter
```

### 5.3 Student — Resume Learning

```
Student Login
    ↓
Course Listing
    ↓
Select Previously Started Course
    ↓
View Existing Progress
    ↓
Resume Learning
```

---

## 6. Non-Functional Requirements

|ID|Requirement|
|---|---|
|NFR-01|The application must provide a responsive user interface.|
|NFR-02|The application must support modern web browsers.|
|NFR-03|User passwords must be securely hashed.|
|NFR-04|API access must enforce role-based authorization.|
|NFR-05|Markdown rendering must be protected against XSS attacks.|
|NFR-06|Progress updates must be safe against repeated requests.|
|NFR-07|Progress data must be persistently stored in the database.|
|NFR-08|API errors must follow a consistent response structure.|
|NFR-09|Administrative operations must be isolated from student operations.|

---

## 7. Out of Scope

The following capabilities are explicitly excluded from the MVP:

|Feature|Status|
|---|---|
|Quizzes and Exams|Out of Scope|
|Assignments and Exercises|Out of Scope|
|Gamification and Scoring|Out of Scope|
|Certificates|Out of Scope|
|Discussions and Comments|Out of Scope|
|Video and Audio Content|Out of Scope|
|File Attachments|Out of Scope|
|Multiple Instructors|Out of Scope|
|Payment and Subscription Systems|Out of Scope|
|User-specific Course Assignment|Out of Scope|
|Independent Enrollment System|Out of Scope|
|Advanced Search|Out of Scope|
|Content Versioning|Out of Scope|
|WYSIWYG Editor|Out of Scope|
|Markdown Preview in Admin Panel|Out of Scope|
|Advanced Admin Analytics|Out of Scope|
|Personal Note-taking|Out of Scope|

---

## 8. Acceptance Criteria

### 8.1 Authentication

- Users can register as Students.
    
- Users can log in and log out.
    
- Students cannot assign themselves the Admin role.
    
- Unauthorized users cannot access administrative APIs.
    

### 8.2 Course Management

- Admin can create courses.
    
- Admin can edit course information.
    
- Admin can publish and unpublish courses.
    
- Admin can delete courses.
    
- Draft courses are not visible to students.
    
- Courses without chapters cannot be published.
    

### 8.3 Content Management

- Admin can create Flat courses.
    
- Admin can create Section-based courses.
    
- Admin can create, edit, and delete sections.
    
- Admin can create, edit, and delete chapters.
    
- Admin can reorder sections and chapters.
    
- Markdown content is stored and rendered correctly.
    
- Deleting a section or chapter removes associated progress records.
    

### 8.4 Student Experience

- Students can browse published courses.
    
- Students can view course content structures.
    
- Students can open individual chapters.
    
- Markdown content is rendered correctly.
    
- Students can manually mark chapters as completed.
    
- Completion status persists across login sessions.
    
- Course progress is calculated correctly.
    
- Students can revisit previously started courses.
    

---

## 9. Initial Domain Model

The following entities represent the conceptual domain model for the MVP.

### User

- id
    
- email
    
- password_hash
    
- role
    
- created_at
    

### Course

- id
    
- title
    
- description
    
- structure_type
    
- status
    
- created_at
    
- updated_at
    

### Section

- id
    
- course_id
    
- title
    
- position
    

### Chapter

- id
    
- course_id (nullable)
    
- section_id (nullable)
    
- title
    
- content
    
- position
    
- created_at
    
- updated_at
    

### ChapterProgress

- id
    
- user_id
    
- chapter_id
    
- is_completed
    
- completed_at
    

### Domain Constraints

1. `Course.structure_type` must be either `FLAT` or `SECTION_BASED`.
    
2. A chapter must belong to exactly one parent: either a course or a section.
    
3. In Flat courses, chapters must belong directly to the course.
    
4. In Section-based courses, chapters must belong to a section.
    
5. Each section must belong to exactly one course.
    
6. The combination of `user_id` and `chapter_id` in ChapterProgress must be unique.
    
7. Deleting a course, section, or chapter must cascade to its dependent records.
    

---

## 10. MVP Delivery Phases

The MVP implementation is divided into four delivery phases.

|Phase|Scope|
|---|---|
|Phase 1 — Foundation|Database, Authentication, Authorization, User Roles|
|Phase 2 — Content Management|Course, Section, Chapter, Markdown Editor, Publishing|
|Phase 3 — Learning Experience|Course Listing, Chapter Reader, Navigation|
|Phase 4 — Progress Tracking|Chapter Completion, Progress Calculation, Student Dashboard|

Each phase should be independently testable before proceeding to the next phase.

---

## 11. Assumptions and Product Decisions

|Topic|Decision|
|---|---|
|User Roles|Admin and Student|
|Registration|Public Student Registration|
|Admin Provisioning|Secure Initial Setup|
|Course Access|All Published Courses Available to All Students|
|Enrollment|No Separate Enrollment Process|
|Completion Method|Manual|
|Progress Unit|Chapter|
|Content Format|Markdown|
|Admin Editor|Plain Textarea|
|Content Preview|Student Panel Only|
|Course Structure|Flat or Section-based|
|Nested Sections|Not Supported|
|Progress Persistence|Database|
|Course Progress|Calculated from ChapterProgress|
|Deletion Policy|Cascade|
|Course Publication|Draft / Published|

---

## 12. Technical Specification Boundary

This PRD defines product requirements and expected behavior. Detailed implementation decisions are deferred to the Technical Specification.

The following topics will be defined separately:

- Backend and Frontend Architecture
    
- Database Schema and ERD
    
- REST API Design and OpenAPI Contracts
    
- Authentication and Session Management
    
- Markdown Parsing and Sanitization
    
- Authorization and Access Control
    
- Transaction Management for Deletion Operations
    
- Error Handling
    
- Unit, Integration, and End-to-End Testing
    
- Deployment and Environment Configuration