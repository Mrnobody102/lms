---
name: instructor-role-model
description: Product decision on what the INSTRUCTOR role means and FE app structure
metadata:
  type: project
---

Quyết định (chốt 2026-05-29): INSTRUCTOR là **giảng viên/trợ giảng scope theo course được gán** (`CourseInstructorAssignment`), KHÔNG phải đồng tác giả toàn tenant và KHÔNG phải peer của ADMIN. Phải đứng rõ dưới ADMIN.

Hệ quả cần làm (chưa làm xong tại thời điểm chốt):

- Route-level role gating trong web-admin: `AuthGuard` hiện chỉ check role ∈ {ADMIN, SUPER_ADMIN, INSTRUCTOR} cho TẤT CẢ ~52 trang — instructor gõ URL `/finance`, `/students`, `/cohorts`, `/reports` vẫn vào được khung trang (data thì bị backend chặn 403). Cần gate theo trang.
- Scope authoring theo assignment: practice/roleplay/marketplace hiện cho instructor quyền gần bằng admin, phần lớn không scope theo `instructorAssignments`. Cần siết về đúng course được gán.
- Vá `lessonWhere` trong `LearningAccessService`: thiếu nhánh INSTRUCTOR (chỉ có STUDENT), nên data lesson-level rò giữa các instructor cùng tenant. `courseWhere` thì đã có nhánh INSTRUCTOR đúng.

**Why:** User cảm thấy instructor đang "tương đương admin" vì route không gate + authoring rộng. Đúng một phần.
**How to apply:** Khi mở rộng quyền instructor, luôn scope theo `CourseInstructorAssignment`; security boundary thật nằm ở API (backend authz), không phải ở việc tách FE app.

Quyết định FE: KHÔNG tách app instructor riêng. Trợ giảng = subset của admin trên cùng domain entities → role-gating trong web-admin, không phải app thứ 5. Tách app không tăng bảo mật (cùng API + cùng JWT). Liên quan [[[lms-fe-apps]]].
