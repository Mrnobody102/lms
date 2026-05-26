'use client';

import { ArrowRight, Star, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';

export function FeaturedCoursesSection() {
  const t = useTranslations('Student');

  // This would ideally come from the API (Tenant public courses)
  // For the template, we mock a few attractive courses
  const courses = [
    {
      id: '1',
      title: 'IELTS Intensive 7.0+',
      image:
        'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=800&q=80',
      tag: 'HOT',
      students: 1250,
      rating: 4.9,
    },
    {
      id: '2',
      title: t('landing.courses.featured.communication360'),
      image:
        'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80',
      tag: 'NEW',
      students: 840,
      rating: 4.8,
    },
    {
      id: '3',
      title: 'Business English Pro',
      image:
        'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80',
      tag: 'PRO',
      students: 520,
      rating: 5.0,
    },
  ];

  return (
    <section id="courses" className="py-24 bg-muted/20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight">
              {t('landing.courses.title')}
            </h2>
            <p className="text-lg text-muted-foreground font-medium">{t('landing.courses.desc')}</p>
          </div>
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 text-primary font-bold hover:text-primary/80 transition-colors group whitespace-nowrap"
          >
            {t('landing.courses.viewAll')}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/courses/${course.id}`}
              className="group rounded-3xl bg-card border border-border/50 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 flex flex-col"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={course.image}
                  alt={course.title}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                  {course.tag}
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-bold mb-4 group-hover:text-primary transition-colors line-clamp-2">
                  {course.title}
                </h3>

                <div className="mt-auto flex items-center justify-between text-sm text-muted-foreground font-medium">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-primary/70" />
                    <span>
                      {course.students} {t('landing.courses.students')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-orange-500/10 text-orange-600 px-2.5 py-1 rounded-full">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="font-bold">{course.rating}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
