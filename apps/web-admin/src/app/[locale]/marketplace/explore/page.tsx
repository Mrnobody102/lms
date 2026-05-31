'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AdminHeader } from '@/components/layout/admin-header';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AuthGuard } from '@/components/layout/auth-guard';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { useMarketplaceItems, useSubscribeMarketplaceItem } from '@/hooks/use-marketplace';
import { Button, Separator, Skeleton, Alert, AlertDescription, Input } from '@/components/ui';
import { AlertCircle, Search, PackageSearch, CheckCircle2 } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';

export default function MarketplaceExplorePage() {
  const t = useTranslations('Admin');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const { data: resData, isLoading, error } = useMarketplaceItems();
  const subscribeMutation = useSubscribeMarketplaceItem();

  const allItems = Array.isArray(resData?.data?.items) ? resData.data.items : [];
  const items = allItems.filter((i: { title: string }) =>
    i.title.toLowerCase().includes(debouncedSearch.toLowerCase()),
  );

  const errorMessage = error instanceof Error ? error.message : error ? String(error) : null;

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col md:flex-row bg-background">
        <AdminSidebar />
        <main className="flex-1 md:ml-[var(--admin-sidebar-width)] p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <AdminHeader
              title={t('marketplace.exploreNav')}
              description={t('marketplace.exploreDescription')}
              showCreateCourse={false}
            />

            {/* Search Bar */}
            <div className="flex h-11 flex-1 items-center rounded-xl border border-input bg-background text-foreground shadow-sm mb-6 max-w-md focus-within:ring-4 focus-within:ring-primary/10">
              <Search className="ml-3.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <Input
                placeholder={t('marketplace.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-full min-w-0 flex-1 border-0 bg-transparent px-3 py-0 shadow-none focus-visible:ring-0"
              />
            </div>

            <Separator className="mb-8" />

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-card border rounded-xl p-5 space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-10 w-full mt-4 rounded-lg" />
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
                  <PackageSearch className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold tracking-tight mb-2">
                  {t('marketplace.exploreEmptyTitle')}
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {t('marketplace.exploreEmptyDescription')}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map(
                  (item: {
                    id: string;
                    title: string;
                    resourceType: string;
                    description?: string;
                    pricingModel: string;
                    price: number;
                    ownerTenant?: { name: string };
                    subscriptions?: unknown[];
                  }) => {
                    const isSubscribed = item.subscriptions && item.subscriptions.length > 0;
                    return (
                      <div
                        key={item.id}
                        className="bg-card border rounded-xl p-5 hover:shadow-md transition-all flex flex-col"
                      >
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h4 className="font-semibold text-lg">{item.title}</h4>
                            <span className="bg-muted px-2 py-1 rounded-md text-xs font-medium">
                              {item.resourceType}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                            {item.description}
                          </p>
                          <div className="mt-4 text-sm font-medium text-primary">
                            {item.pricingModel === 'FREE'
                              ? t('marketplace.freePrice')
                              : t('marketplace.priceValue', {
                                  price: item.price.toLocaleString(),
                                })}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {t('marketplace.providedBy', {
                              name: item.ownerTenant?.name ?? t('marketplace.anonymousProvider'),
                            })}
                          </div>
                        </div>

                        <div className="mt-6">
                          {isSubscribed ? (
                            <Button
                              variant="secondary"
                              className="w-full rounded-lg bg-green-50 text-green-700 hover:bg-green-100 border-green-200 border cursor-default"
                              disabled
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />{' '}
                              {t('marketplace.subscribed')}
                            </Button>
                          ) : (
                            <ConfirmDialog
                              description={t('marketplace.subscribeConfirm')}
                              confirmLabel={t('marketplace.subscribeCta')}
                              onConfirm={() => subscribeMutation.mutate({ id: item.id })}
                            >
                              <Button
                                className="w-full rounded-lg"
                                disabled={subscribeMutation.isPending}
                              >
                                {t('marketplace.subscribeCta')}
                              </Button>
                            </ConfirmDialog>
                          )}
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
