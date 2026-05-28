import { CourseDetailClient } from '@/components/course-detail-client';

export default async function CourseDetailPage(props: {
  params: Promise<{ courseId: string }>;
}): Promise<JSX.Element> {
  const params = await props.params;

  return <CourseDetailClient courseId={params.courseId} />;
}
