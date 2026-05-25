# Planning Templates Reference

This document provides concrete templates and examples for planning LMS features.

## Implementation Plan Template

```markdown
# Feature: <Feature Name>

## Overview

Brief description of the feature, its purpose, and target users.

## Goals

- Primary goal
- Secondary goal

## Non-Goals (Out of Scope)

- What is explicitly NOT included

## Data Model

### Prisma Schema Changes

<!-- Document any changes to apps/api-server/prisma/schema.prisma -->

### Relationships

<!-- Describe foreign key relationships and cascade rules -->

## API Design

### Endpoints

| Method | Path          | Description     | Auth     |
| ------ | ------------- | --------------- | -------- |
| GET    | /resource     | List items      | Required |
| POST   | /resource     | Create item     | Admin    |
| GET    | /resource/:id | Get single item | Required |
| PATCH  | /resource/:id | Update item     | Admin    |
| DELETE | /resource/:id | Delete item     | Admin    |

### DTOs

<!-- Define request/response DTOs with field names and types -->

## Frontend Changes

### web-student

- Page: `/app/[locale]/path/page.tsx`
- Components: list of components to create/modify
- API hooks: list of hooks to add/modify

### web-admin

- Page: `/app/[locale]/path/page.tsx`
- Components: list of components to create/modify
- API hooks: list of hooks to add/modify

### super-portal

- Any changes to the public-facing portal

## Task Breakdown

### Phase 1: Database

- [ ] Create Prisma migration
- [ ] Verify schema with `prisma validate`
- [ ] Generate client: `pnpm --filter api-server db:generate`

### Phase 2: API Server

- [ ] Task 1
- [ ] Task 2

### Phase 3: Frontend

- [ ] Task 3
- [ ] Task 4

### Phase 4: i18n

- [ ] Add translation keys to `vi.json` and `en.json` in affected app(s)

### Phase 5: Testing

- [ ] Unit tests for service layer
- [ ] Integration tests for controller
- [ ] Manual verification steps

## Risk Assessment

| Risk                            | Likelihood | Impact | Mitigation                        |
| ------------------------------- | ---------- | ------ | --------------------------------- |
| Breaking existing API contracts | Low        | High   | Version the endpoint              |
| Migration conflicts             | Medium     | Medium | Run migration in CI before deploy |

## Verification

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Frontend builds without errors
- [ ] Manual smoke test on staging

## Rollout Plan

1. Deploy migration to staging
2. Deploy API to staging
3. Deploy frontend to staging
4. QA verification
5. Deploy migration to production
6. Deploy API to production
7. Deploy frontend to production
```

---

## Task Breakdown Examples

### Example: Adding a Quiz Feature

```
API Server Tasks:
  1. Add Quiz, Question, AnswerOption models to schema.prisma
  2. Run prisma migrate dev --name add_quiz
  3. Create QuizModule, QuizService, QuizController
  4. Implement CRUD endpoints: POST/GET/PATCH/DELETE /quizzes
  5. Add submission endpoint: POST /quizzes/:id/submit
  6. Add Swagger decorators to all endpoints
  7. Write unit tests: QuizService (80% coverage)
  8. Write integration tests: QuizController endpoints

web-admin Tasks:
  1. Add quiz management page: /admin/quizzes
  2. Add quiz creation/edit form component
  3. Add question builder component with multiple choice support
  4. Wire up API hooks: useQuiz, useCreateQuiz, useSubmitQuiz
  5. Add quiz list and detail views
  6. Add translation keys: quiz.* in vi.json and en.json

web-student Tasks:
  1. Add quiz taking page: /learn/quiz/:id
  2. Implement quiz progress indicator
  3. Add answer selection UI with immediate feedback option
  4. Add results summary page after submission
  5. Add translation keys for quiz UI strings
```

### Example: Adding Progress Tracking

```
API Server Tasks:
  1. Add LessonProgress model to schema.prisma
  2. Run prisma migrate dev --name add_lesson_progress
  3. Create ProgressModule, ProgressService
  4. Add PATCH /lessons/:id/progress endpoint
  5. Add GET /students/:id/progress endpoint
  6. Write unit tests

web-student Tasks:
  1. Add progress indicator to lesson page header
  2. Add "Mark as complete" button
  3. Add progress to curriculum sidebar
  4. Add translation keys
```

---

## Walkthrough Template

```markdown
# Walkthrough: <Feature Name>

## Completed

- What was implemented
- Key decisions and trade-offs

## How to Test

1. Step-by-step instructions
2. Expected outcomes at each step

## Known Limitations

- Any caveats or items not yet implemented

## Screenshots / Evidence

<!-- Links to screenshots if applicable -->
```

---

## LMS Feature Categories

Use these categories to group tasks when planning:

| Category           | Examples                                 |
| ------------------ | ---------------------------------------- |
| Content Management | Courses, Lessons, Roadmaps, Vocabulary   |
| User Management    | Students, Admins, Roles, Permissions     |
| Engagement         | Quizzes, Flashcards, Progress Tracking   |
| Community          | Blog, Rankings, Discussions              |
| Commerce           | Subscriptions, Payments, Premium Content |
| Infrastructure     | Auth, Notifications, File Uploads        |
