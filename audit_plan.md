# Source Code Audit Plan

## Goals

Audit the LMS codebase for real bugs, business-logic gaps, security regressions, and core feature readiness after the recent architecture changes:

- Standalone practice exercises, exams, AI generation jobs, and roleplay scenarios can exist without a course.
- Course learning paths can embed practice/exam nodes through `Lesson`.
- Legacy `Lesson.quiz` JSON is removed from the main learning flow.
- Micro-card/SRS pronunciation data uses `phonetics` instead of a language-specific pronunciation field, while preserving legacy compatibility.

## Audit Principles

- Prioritize behavior that can leak tenant data, block learners, corrupt progress, or make core authoring flows unusable.
- Treat typecheck/lint success as a baseline only; review business semantics separately.
- Verify both standalone and course-bound resources.
- Check role-specific behavior for super admin, admin, instructor, and student.
- Produce findings with file/line references, severity, impact, and recommended fix.

## Phase 1: Data Model And Schema

Review:

- `packages/database/prisma/schema.prisma`
- Relation optionality for `courseId`, `unitId`, attempts, lessons, AI jobs, roleplay scenarios.
- Composite tenant relations and cross-tenant safety.
- Cascades and `onDelete` behavior for optional course-bound resources.
- Indexes and query patterns for standalone resources.
- Marketplace resource types for course, exam, practice set, and media asset.
- Seed data compatibility after removing `Lesson.quiz`.
- Any remaining hardcoded legacy fields such as `quiz` JSON or a language-specific pronunciation write path.

Output:

- Schema consistency findings.
- Legacy data migration or cleanup recommendations.
- Index/performance risks.

## Phase 2: Backend Business Logic

Review modules:

- `lesson`: create/update/delete, lesson type validation, practice/exam node attachment, reorder, progress, micro-card events.
- `practice`: standalone/course-bound question and set creation, student visibility, attempt submission, answer scoring, SRS, skill mastery, adaptive learning.
- `exam`: standalone/course-bound exam creation, start/submit attempts, result visibility, SRS, skill mastery.
- `roleplay`: standalone/course-bound scenario creation and student access.
- `srs`: custom cards, legacy pronunciation read compatibility, `phonetics` write path.
- `discussion`: practice discussions for standalone resources.
- `reports` and `risk flags`: course reports must not miscount standalone attempts.
- `progress` and `certificates`: course completion must remain course-bound and not accidentally include standalone resources.
- `ai` and background jobs: AI question generation, job state transitions, retry/failure behavior.
- `media`: audio asset validation, tenant ownership, and stale media references.

Output:

- Critical/High/Medium/Low backend findings.
- Missing validation or access-control checks.
- Suggested tests for each risky path.

## Phase 3: API Contracts And DTOs

Review:

- DTO optional/nullable behavior versus Prisma types.
- `class-validator` rules for `courseId`, `unitId`, `practiceExerciseSetId`, `examId`.
- Swagger decorators and descriptions.
- API client types in admin and student apps.
- React Query hooks that should work with or without `courseId`.
- Error responses for invalid standalone/course-bound combinations.

Output:

- Contract mismatches.
- Breaking changes for existing clients.
- Endpoint smoke-test matrix.

## Phase 4: Admin Frontend

Review flows:

- Course editor lesson add/edit/duplicate/reorder.
- Lesson type controls for text, video, simulation, micro-card, practice, and exam.
- Practice set and exam selection dropdowns inside lesson forms.
- Practice admin: create/edit questions, create/edit exercise sets, standalone mode, AI generation, review queue.
- Exam admin: create/edit/duplicate standalone and course-bound exams.
- Marketplace/admin publishing flows if present.
- i18n labels for English/Vietnamese.

Output:

- UI state bugs.
- Missing standalone authoring affordances.
- Any label or translation mismatch.

## Phase 5: Student Frontend

Review flows:

- Course lesson renderer for text, video, simulation, micro-card, practice, and exam nodes.
- Standalone practice listing, detail, submit, and attempt review.
- Standalone exam listing, start, submit, result, and attempt review.
- SRS review queue for custom, practice, and exam cards.
- Custom card create/edit using `phonetics`.
- Legacy micro-card pronunciation content still rendering as phonetics.
- Navigation between course-bound and standalone resources.

Output:

- Learner-blocking UI bugs.
- Incorrect empty/loading/error states.
- Route and permission inconsistencies.

## Phase 6: Security And Tenant Isolation

Review:

- All `findFirst`, `findMany`, `update`, `delete`, and nested relation filters include tenant scope.
- Student access checks for published/unpublished and enrolled/non-enrolled resources.
- Instructor/admin scope assumptions.
- Standalone resources cannot be accessed across tenants.
- Discussion, SRS, media, report, and AI endpoints do not leak cross-tenant data.
- Bulk operations cannot mutate resources outside tenant scope.

Output:

- Security findings first, regardless of module.
- Reproduction steps and recommended guard/query changes.

## Phase 7: Reliability, Observability, And Performance

Review:

- Long-running AI generation behavior and failure recovery.
- Prisma query patterns for N+1 risks in reports, course detail, attempts, review queues.
- Soft-delete filtering consistency.
- Logging of failed adaptive learning, AI, SRS, and media operations.
- Idempotency of seed and retryable operations.
- Cache invalidation in React Query.

Output:

- Performance hotspots.
- Missing logs or silent failure risks.
- Idempotency issues.

## Phase 8: Automated Verification

Run:

- `pnpm run typecheck`
- `pnpm run lint`
- Relevant unit/integration tests if available and stable.
- `npx prisma format`
- `npx prisma validate`
- `npx prisma db push --skip-generate` against a dev/test database only.

Add or recommend tests:

- Create standalone practice question and exercise set.
- Submit standalone practice attempt.
- Create/start/submit standalone exam.
- Student cannot access unpublished standalone practice/exam.
- Student can list published standalone practice/exam without `courseId`.
- Course lesson can embed practice/exam node.
- Legacy micro-card pronunciation data parses into `phonetics`.
- SRS custom cards write `phonetics`.
- Reports exclude standalone attempts from course metrics.

## Phase 9: Manual Smoke Matrix

Verify manually:

- Admin creates standalone exam and practice set.
- Admin attaches an existing practice set/exam to a course lesson.
- Student opens course path and enters embedded practice/exam.
- Student opens standalone practice/exam from listing.
- Student creates custom review card with phonetics.
- Course reports still work for course-bound attempts.
- Seed can run on a clean dev database.

## Final Report Format

The audit report should contain:

- Executive readiness summary for each core area:
  - Course learning path
  - Standalone practice
  - Standalone exam
  - Micro-card/SRS multilingual support
  - Admin authoring
  - Student learning
  - Reporting/progress
  - Tenant isolation/security
- Findings ordered by severity.
- Open questions and assumptions.
- Verification commands and results.
- Recommended fix order.
- Release notes and rollback considerations.
