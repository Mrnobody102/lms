'use client';

import { useTranslations } from 'next-intl';
import { AdminHeader } from '@/components/layout/admin-header';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AuthGuard } from '@/components/layout/auth-guard';
import { useProviderItems } from '@/hooks/use-marketplace';
import { Button, Separator, Skeleton, Alert, AlertDescription } from '@/components/ui';
import { AlertCircle, Store } from 'lucide-react';

export default function MarketplaceProviderPage() {
  const t = useTranslations('Admin');
  const { data: resData, isLoading, error } = useProviderItems();

  const items = Array.isArray(resData?.data?.items) ? resData.data.items : [];
  const errorMessage = error instanceof Error ? error.message : error ? String(error) : null;

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col md:flex-row bg-background">
        <AdminSidebar />
        <main className="flex-1 md:ml-[var(--admin-sidebar-width)] p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <AdminHeader
              title={t('marketplace.providerNav')}
              description={t('marketplace.providerDescription')}
              showCreateCourse={false}
            />

            <Separator className="mb-8" />

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-card border rounded-xl p-5 space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-8 w-full rounded-md" />
                  </div>
                ))}
              </div>
            ) : errorMessage ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center rounded-xl border border-dashed bg-muted/20">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-5">
                  <Store className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold tracking-tight mb-2">
                  {t('marketplace.providerEmptyTitle')}
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mb-8">
                  {t('marketplace.providerEmptyDescription')}
                </p>
                <Button className="rounded-xl px-6">{t('marketplace.publishResource')}</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map(
                  (item: {
                    id: string;
                    title: string;
                    description?: string;
                    pricingModel: string;
                    price: number;
                    resourceType: string;
                  }) => (
                    <div
                      key={item.id}
                      className="bg-card border rounded-xl p-5 hover:shadow-md transition-shadow"
                    >
                      <h4 className="font-semibold">{item.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {item.description}
                      </p>
                      <div className="mt-4 pt-4 border-t flex justify-between items-center text-sm">
                        <span className="font-medium text-primary">
                          {item.pricingModel === 'FREE'
                            ? t('marketplace.freePrice')
                            : t('marketplace.priceValue', {
                                price: item.price.toLocaleString(),
                              })}
                        </span>
                        <span className="bg-muted px-2 py-1 rounded-md text-xs">
                          {item.resourceType}
                        </span>
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
