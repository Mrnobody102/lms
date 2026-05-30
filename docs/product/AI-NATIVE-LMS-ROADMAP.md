# AI-Native LMS Roadmap (2026–2028)

Cập nhật lần cuối: 2026-05-30

## Mục tiêu

Tài liệu này là plan chiến lược cấp sản phẩm + kỹ thuật để chuyển LMS Platform từ mô hình “LMS có thêm AI” sang **AI-native LMS**: AI giải quyết painpoint thực tế theo từng role, có kiểm soát chất lượng, bảo mật tenant và hiệu quả chi phí.

Tài liệu này bổ sung cho:
- [PLAN.md](PLAN.md)
- [ENGINEERING-BACKLOG.md](ENGINEERING-BACKLOG.md)
- [features.md](features.md)
- [architecture-plan.md](architecture-plan.md)

## North-star outcomes

1. **Student outcomes**: tăng completion rate, mastery growth, retention.
2. **Instructor productivity**: giảm thời gian chuẩn bị/chấm điểm, tăng chất lượng phản hồi.
3. **Center economics**: tăng hiệu quả vận hành, kiểm soát chi phí AI theo gói.

## Product principles

- AI chỉ được ưu tiên khi tạo giá trị học tập/vận hành đo được.
- High-stakes workflows (grading/final feedback/publishing) dùng human-in-the-loop.
- Backend là source of truth cho role policy + tenant isolation.
- Một `web-admin` cho admin + instructor, phân tách bằng capability matrix và server authorization.
- AI usage phải có quota/token governance theo tenant package.

## End-to-end business flow

1. Student signup/login (tenant-aware).
2. Course discovery.
3. Decision gate: `SELF_PACED` vs `INSTRUCTOR_LED`.
4. Enrollment:
   - Self-paced: activate trực tiếp sau điều kiện thanh toán/license.
   - Instructor-led: chọn run/lớp, seat allocation, approval/payment.
5. Learning execution:
   - Self-paced content/practice/exam/AI tutor.
   - Instructor-led online/offline sessions + attendance + assignment.
6. Assessment + grading + release.
7. Completion/certificate/reporting.

## Role-based AI applications

### Student
- In-context tutor cho practice/exam/lesson context.
- AI roleplay coach (text/audio), pronunciation feedback.
- Remediation planner theo skill yếu + SRS due.

### Instructor
- Course/lesson drafting from prompt.
- Assignment/question draft generation with review workflow.
- AI grading assistant (draft scoring + explanation), instructor final approval.
- Class intervention suggestions từ risk/mastery signals.

### Admin (center)
- Cohort risk and intervention assistant.
- Enrollment and schedule operations copilot.
- Reporting copilot (insight + recommended actions).

### Super Admin
- Tenant adoption/usage intelligence.
- Quota/package anomaly detection.

## Capability boundaries (must-have)

- **Identity & Access**: role policy, tenant boundary.
- **Catalog & Delivery**: modality-aware course offerings.
- **Run/Scheduling**: online/offline sessions, timezone, conflicts.
- **Enrollment & Commerce**: lifecycle state machine, package/license constraints.
- **Assessment**: submission window, grading workflow, release policy.
- **AI Platform**: provider abstraction, prompt governance, quota metering.
- **Reporting & Audit**: traceability cho mọi action nhạy cảm.

## Phased roadmap

## Phase A (Now): Strategic alignment + docs governance
- Đồng bộ docs product/architecture/backlog theo hướng AI-native.
- Chuẩn hóa capability matrix theo role.

## Phase B (Near-term quick wins)
- Seed demo instructor + assignment + roleplay samples.
- Audit log cho instructor-sensitive actions.
- Test edge cases tenant/role/course-assignment.

## Phase C (Core domain foundation)
- Additive schema cho modality/run/session:
  - `SELF_PACED`, `INSTRUCTOR_LED_ONLINE`, `INSTRUCTOR_LED_OFFLINE`, `HYBRID`.
- Scheduling + attendance primitives (online/offline).
- Enrollment lifecycle tách nhánh self-paced vs instructor-led.

## Phase D (AI copilots + commercialization)
- Instructor/Student/Admin copilots với policy guardrails.
- Nâng quota từ per-user coarse limit lên package-aware metering:
  - tenant package
  - role bucket
  - feature weight
  - period reset
- Prompt governance + usage/cost analytics.

## Phase E (Scale & competitiveness)
- Tenant customization policy bundles.
- Outcome-driven optimization loops (A/B prompts, intervention efficacy).
- Platform moat: analytics depth + domain-specific AI workflows.

## KPI framework

- Student: completion rate, weekly active learners, skill mastery delta, overdue SRS ratio.
- Instructor: prep time saved, grading turnaround, intervention success rate.
- Business: AI cost/active learner, conversion to paid package, retention.
- Reliability: AI success rate, latency SLO, quota denial correctness, audit coverage.

## Governance & safety

- Không lộ dữ liệu chéo tenant trong prompt/context assembly.
- Prompt/version tracking bắt buộc cho AI-generated content.
- Audit log cho create/approve/publish/grade-change workflows.
- Safety fallback: nếu AI fail hoặc confidence thấp, route về human review.

## Quyết định kiến trúc đã chốt

1. Giữ một `web-admin` chung cho admin/instructor.
2. Tăng cường backend policy enforcement, không dựa vào UI hiding.
3. Ưu tiên additive migrations và compatibility layers, tránh rewrite lớn.
4. Ưu tiên use-cases AI gắn trực tiếp painpoint có thể đo lường.

## Definition of done cho mỗi epic AI-native

- Có mô hình dữ liệu/API/UI/test/docs đồng bộ.
- Tenant isolation + role authorization được test rõ.
- Có auditability cho action nhạy cảm.
- Có KPI đo tác động thực tế (không chỉ “feature shipped”).
