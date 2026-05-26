'use client';

import dynamic from 'next/dynamic';
import { useAuthStore } from '../../features/auth/auth.store';

import { LandingNav } from '../../components/landing/landing-nav';
import { HeroSection } from '../../components/landing/hero-section';
import { StatsSection } from '../../components/landing/stats-section';
import { FeaturesSection } from '../../components/landing/features-section';
import { FeaturedCoursesSection } from '../../components/landing/featured-courses';
import { ContactFooter } from '../../components/landing/contact-footer';

// Code-split: dashboard is a heavy module (recharts, many widgets).
// Users who aren't logged in never download it.
const LearningDashboard = dynamic(() => import('../../components/dashboard/learning-dashboard'), {
  loading: () => (
    <div className="flex-1 flex items-center justify-center min-h-[50vh]">
      <div className="w-8 h-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  ),
});

export default function Home() {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <LearningDashboard />;
  }

  return (
    <div className="min-h-screen font-sans bg-background selection:bg-primary/30 scroll-smooth">
      <LandingNav />
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <FeaturedCoursesSection />
      <ContactFooter />
    </div>
  );
}
