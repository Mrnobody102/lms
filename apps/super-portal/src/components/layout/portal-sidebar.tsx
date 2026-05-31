'use client';

import {
  Activity,
  Building2,
  CreditCard,
  Database,
  Flag,
  Globe2,
  HardDrive,
  ListChecks,
  ServerCog,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';

export function PortalSidebar() {
  const t = useTranslations('SuperPortal.sidebar');
  const items = [
    { label: t('overview'), icon: Activity, href: '/' },
    { label: t('tenants'), icon: Building2, href: '/' },
    { label: t('billing'), icon: CreditCard, href: '/plans-billing' },
    { label: t('usage'), icon: HardDrive, href: '/usage-storage' },
    { label: t('domains'), icon: Globe2, href: '/domains' },
    { label: t('flags'), icon: Flag, href: '/feature-flags' },
    { label: t('incidents'), icon: ListChecks, href: '/incidents' },
    { label: t('audit'), icon: Database, href: '/audit-logs' },
    { label: t('infrastructure'), icon: ServerCog, href: '/infrastructure' },
  ];

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-card/70 p-4 lg:block">
      <div className="mb-6 px-2">
        <p className="text-sm font-bold">{t('title')}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t('subtitle')}</p>
      </div>
      <nav className="space-y-1">
        {items.map((item) => (
          <PortalNavLink key={item.label} item={item} />
        ))}
      </nav>
    </aside>
  );
}

function PortalNavLink({
  item,
}: {
  item: { href: string; icon: React.ComponentType<{ className?: string }>; label: string };
}) {
  const Icon = item.icon;
  const className =
    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground';

  return (
    <Link href={item.href} className={className}>
      <Icon className="h-4 w-4" />
      {item.label}
    </Link>
  );
}
