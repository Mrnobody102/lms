'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  BrainCircuit,
  Pencil,
  Plus,
  Trash2,
  Wand2,
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { AuthRequiredPanel } from '@/components/auth/auth-required-panel';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { StudentNav } from '@/components/layout/student-nav';
import { SrsStatsChart } from '@/components/srs/srs-stats-chart';
import { useAuthStore } from '@/features/auth/auth.store';
import {
  useCreateCustomCard,
  useCustomCards,
  useDeleteCustomCard,
  useUpdateCustomCard,
} from '@/hooks/use-srs';
import type { ReviewCard } from '@/lib/srs-api';
import { defaultApiClient as api } from '@repo/api-client';
import { Link } from '@/navigation';

export default function CustomCardsPage() {
  const t = useTranslations('Student.srs.customCards');
  const { isAuthenticated, isInitialized } = useAuthStore();
  const { data: cards, isLoading } = useCustomCards(isAuthenticated);
  const createCard = useCreateCustomCard();
  const updateCard = useUpdateCustomCard();
  const deleteCard = useDeleteCustomCard();

  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    front: '',
    back: '',
    phonetics: '',
    example: '',
    skillCode: '',
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkData, setBulkData] = useState({ topic: '', count: '5', context: '' });
  const [bulkPreviewCards, setBulkPreviewCards] = useState<
    { front: string; back: string; phonetics: string; example: string }[]
  >([]);
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [isBulkSaving, setIsBulkSaving] = useState(false);

  const resetForm = () => {
    setFormData({ front: '', back: '', phonetics: '', example: '', skillCode: '' });
    setEditingCardId(null);
    setIsFormOpen(false);
    setApiError(null);
  };

  const handleEdit = (card: ReviewCard) => {
    const customContent = card.customContent;
    setFormData({
      front: customContent?.front || '',
      back: customContent?.back || '',
      phonetics: customContent?.phonetics || '',
      example: customContent?.example || '',
      skillCode: card.skillCodes?.[0] || '',
    });
    setEditingCardId(card.id);
    setIsFormOpen(true);
    setApiError(null);
  };

  const handleGenerateAI = async () => {
    if (!formData.front.trim()) {
      setApiError(t('frontRequiredForAI'));
      return;
    }
    setApiError(null);
    setIsGenerating(true);
    try {
      const res = await api.post('/ai/generate-flashcard', { front: formData.front.trim() });
      const data = res.data as { back: string; phonetics: string; example: string };
      setFormData((prev) => ({
        ...prev,
        back: data.back || prev.back,
        phonetics: data.phonetics || prev.phonetics,
        example: data.example || prev.example,
      }));
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      setApiError(error.response?.data?.message || error.message || t('aiGenerateError'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      customContent: {
        front: formData.front,
        back: formData.back,
        phonetics: formData.phonetics,
        example: formData.example,
      },
      skillCodes: formData.skillCode ? [formData.skillCode] : [],
    };

    if (editingCardId) {
      updateCard.mutate(
        { cardId: editingCardId, data: payload },
        {
          onSuccess: resetForm,
        },
      );
    } else {
      createCard.mutate(payload, {
        onSuccess: resetForm,
      });
    }
  };

  const handleBulkGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkData.topic.trim()) {
      setApiError(t('bulkGenerateTopicPlaceholder'));
      return;
    }
    setApiError(null);
    setIsBulkGenerating(true);
    setBulkPreviewCards([]);
    try {
      const res = await api.post('/ai/generate-flashcards-bulk', {
        topic: bulkData.topic.trim(),
        count: normalizeBulkCount(bulkData.count),
        context: bulkData.context.trim() || undefined,
      });
      setBulkPreviewCards(
        res.data as { front: string; back: string; phonetics: string; example: string }[],
      );
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      setApiError(error.response?.data?.message || error.message || t('bulkGenerateError'));
    } finally {
      setIsBulkGenerating(false);
    }
  };

  const handleBulkSave = async () => {
    setIsBulkSaving(true);
    try {
      await Promise.all(
        bulkPreviewCards.map((card) =>
          createCard.mutateAsync({
            customContent: {
              front: card.front,
              back: card.back,
              phonetics: card.phonetics,
              example: card.example,
            },
            skillCodes: [],
          }),
        ),
      );
      setBulkPreviewCards([]);
      setBulkData({ topic: '', count: '5', context: '' });
      setIsBulkOpen(false);
    } catch (_error) {
      setApiError(t('reviewSubmitError'));
    } finally {
      setIsBulkSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col">
      <StudentNav showLinks />

      <main className="flex-1 mx-auto max-w-4xl px-6 py-12 w-full">
        {isInitialized && !isAuthenticated ? (
          <AuthRequiredPanel returnTo="/review/custom-cards" />
        ) : (
          <>
            <div className="flex items-center justify-between mb-8">
              <div>
                <Link
                  href="/"
                  className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {t('title')}
                </Link>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <BrainCircuit className="h-8 w-8 text-primary" />
                  {t('managerTitle')}
                </h1>
                <p className="text-muted-foreground mt-2">{t('description')}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsBulkOpen(true)}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-primary/20 bg-primary/10 px-4 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors"
                >
                  <Sparkles className="h-4 w-4" />
                  {t('generateBulk')}
                </button>
                <button
                  onClick={() => setIsFormOpen(true)}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  <Plus className="h-4 w-4" />
                  {t('addCard')}
                </button>
              </div>
            </div>

            <div className="mb-8">
              <SrsStatsChart enabled={isAuthenticated} />
            </div>

            <div className="space-y-4">
              {!isInitialized || isLoading ? (
                <div className="py-12 text-center text-muted-foreground animate-pulse">
                  {t('loading')}
                </div>
              ) : cards?.length === 0 ? (
                <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
                  <BrainCircuit className="mx-auto h-12 w-12 opacity-20 mb-4" />
                  <p>{t('noCards')}</p>
                </div>
              ) : (
                cards?.map((card) => {
                  const content = card.customContent;
                  return (
                    <div
                      key={card.id}
                      className="group flex flex-col justify-between rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-3 mb-1">
                          <h3 className="truncate text-lg font-bold">{content?.front}</h3>
                          {content?.phonetics && (
                            <span className="text-sm font-medium text-primary">
                              {content.phonetics}
                            </span>
                          )}
                          {card.skillCodes?.length > 0 && (
                            <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                              {card.skillCodes[0]}
                            </span>
                          )}
                        </div>
                        {content?.back && (
                          <p className="truncate text-sm text-muted-foreground">{content.back}</p>
                        )}
                        {content?.example && (
                          <p className="mt-1 truncate text-xs italic text-muted-foreground">
                            {content.example}
                          </p>
                        )}
                      </div>
                      <div className="mt-4 flex items-center gap-2 opacity-100 transition-opacity sm:mt-0 sm:opacity-0 sm:group-hover:opacity-100">
                        <button
                          onClick={() => handleEdit(card)}
                          className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                          title={t('edit')}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <ConfirmDialog
                          description={t('deleteConfirm')}
                          confirmLabel={t('delete')}
                          cancelLabel={t('cancel')}
                          destructive
                          onConfirm={() => deleteCard.mutate(card.id)}
                        >
                          <button
                            type="button"
                            className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-500/10 rounded-md transition-colors"
                            title={t('delete')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </ConfirmDialog>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {isFormOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 py-6 backdrop-blur-sm">
                <div
                  role="dialog"
                  aria-modal="true"
                  className="max-h-[calc(100vh-3rem)] w-full max-w-3xl overflow-y-auto rounded-lg border bg-card p-6 shadow-xl animate-in fade-in zoom-in-95"
                >
                  <h2 className="mb-4 text-lg font-bold">
                    {editingCardId ? t('edit') : t('addCard')}
                  </h2>
                  {apiError && (
                    <div className="mb-4 flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      {apiError}
                    </div>
                  )}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <div className="mb-1 flex items-center justify-between">
                          <label className="block text-sm font-medium">{t('front')}</label>
                          <button
                            type="button"
                            onClick={handleGenerateAI}
                            disabled={isGenerating || !formData.front.trim()}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 disabled:opacity-50"
                          >
                            {isGenerating ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Wand2 className="h-3 w-3" />
                            )}
                            {t('generateAI')}
                          </button>
                        </div>
                        <input
                          type="text"
                          required
                          value={formData.front}
                          onChange={(e) => setFormData({ ...formData, front: e.target.value })}
                          className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          placeholder={t('frontPlaceholder')}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium">{t('back')}</label>
                        <input
                          type="text"
                          value={formData.back}
                          onChange={(e) => setFormData({ ...formData, back: e.target.value })}
                          className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          placeholder={t('backPlaceholder')}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium">{t('phonetics')}</label>
                        <input
                          type="text"
                          value={formData.phonetics}
                          onChange={(e) => setFormData({ ...formData, phonetics: e.target.value })}
                          className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          placeholder={t('phoneticsPlaceholder')}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium">{t('skillCode')}</label>
                        <input
                          type="text"
                          value={formData.skillCode}
                          onChange={(e) => setFormData({ ...formData, skillCode: e.target.value })}
                          className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          placeholder="VOCAB_1"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">{t('example')}</label>
                      <textarea
                        value={formData.example}
                        onChange={(e) => setFormData({ ...formData, example: e.target.value })}
                        className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        placeholder={t('examplePlaceholder')}
                        rows={3}
                      />
                    </div>
                    <div className="mt-4 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={resetForm}
                        className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
                      >
                        {t('cancel')}
                      </button>
                      <button
                        type="submit"
                        disabled={createCard.isPending || updateCard.isPending || isGenerating}
                        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                      >
                        {t('save')}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {isBulkOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 py-6 backdrop-blur-sm">
                <div
                  role="dialog"
                  aria-modal="true"
                  className="max-h-[calc(100vh-3rem)] w-full max-w-4xl overflow-y-auto rounded-lg border bg-card p-6 shadow-xl animate-in fade-in zoom-in-95"
                >
                  <h2 className="mb-4 text-lg font-bold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    {t('bulkGenerateTitle')}
                  </h2>

                  {apiError && (
                    <div className="mb-4 flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      {apiError}
                    </div>
                  )}

                  {!bulkPreviewCards.length ? (
                    <form onSubmit={handleBulkGenerate} className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-sm font-medium">
                            {t('bulkGenerateTopic')}
                          </label>
                          <input
                            type="text"
                            required
                            value={bulkData.topic}
                            onChange={(e) => setBulkData({ ...bulkData, topic: e.target.value })}
                            className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            placeholder={t('bulkGenerateTopicPlaceholder')}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium">
                            {t('bulkGenerateCount')}
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="20"
                            required
                            value={bulkData.count}
                            onBlur={() =>
                              setBulkData((current) => ({
                                ...current,
                                count: String(normalizeBulkCount(current.count)),
                              }))
                            }
                            onChange={(e) => setBulkData({ ...bulkData, count: e.target.value })}
                            className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          />
                          <p className="mt-1 text-xs text-muted-foreground">
                            {t('bulkGenerateCountHelp')}
                          </p>
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium">
                          {t('bulkGenerateContext')}
                        </label>
                        <input
                          type="text"
                          value={bulkData.context}
                          onChange={(e) => setBulkData({ ...bulkData, context: e.target.value })}
                          className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          placeholder={t('bulkGenerateContextPlaceholder')}
                        />
                      </div>
                      <div className="mt-6 flex justify-end gap-3 border-t pt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setIsBulkOpen(false);
                            setApiError(null);
                          }}
                          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
                        >
                          {t('cancel')}
                        </button>
                        <button
                          type="submit"
                          disabled={isBulkGenerating}
                          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                        >
                          {isBulkGenerating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Wand2 className="h-4 w-4" />
                          )}
                          {isBulkGenerating ? t('bulkGenerateGenerating') : t('bulkGenerateStart')}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">
                          {t('bulkGeneratePreview')} ({bulkPreviewCards.length})
                        </h3>
                        <button
                          onClick={() => setBulkPreviewCards([])}
                          className="text-sm text-muted-foreground hover:text-foreground"
                        >
                          {t('cancel')}
                        </button>
                      </div>
                      <div className="grid gap-3 max-h-[50vh] overflow-y-auto pr-2">
                        {bulkPreviewCards.map((card, idx) => (
                          <div key={idx} className="rounded-lg border p-3 bg-muted/30">
                            <div className="grid grid-cols-2 gap-3 mb-2">
                              <div>
                                <label className="text-xs font-medium text-muted-foreground">
                                  Front
                                </label>
                                <input
                                  type="text"
                                  value={card.front}
                                  onChange={(e) => {
                                    const newCards = [...bulkPreviewCards];
                                    newCards[idx].front = e.target.value;
                                    setBulkPreviewCards(newCards);
                                  }}
                                  className="w-full rounded bg-background border px-2 py-1 text-sm font-medium"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-medium text-muted-foreground">
                                  Back
                                </label>
                                <input
                                  type="text"
                                  value={card.back}
                                  onChange={(e) => {
                                    const newCards = [...bulkPreviewCards];
                                    newCards[idx].back = e.target.value;
                                    setBulkPreviewCards(newCards);
                                  }}
                                  className="w-full rounded bg-background border px-2 py-1 text-sm"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs font-medium text-muted-foreground">
                                  Phonetics
                                </label>
                                <input
                                  type="text"
                                  value={card.phonetics}
                                  onChange={(e) => {
                                    const newCards = [...bulkPreviewCards];
                                    newCards[idx].phonetics = e.target.value;
                                    setBulkPreviewCards(newCards);
                                  }}
                                  className="w-full rounded bg-background border px-2 py-1 text-sm text-primary"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-medium text-muted-foreground">
                                  Example
                                </label>
                                <input
                                  type="text"
                                  value={card.example}
                                  onChange={(e) => {
                                    const newCards = [...bulkPreviewCards];
                                    newCards[idx].example = e.target.value;
                                    setBulkPreviewCards(newCards);
                                  }}
                                  className="w-full rounded bg-background border px-2 py-1 text-xs italic"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-6 flex justify-end gap-3 border-t pt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setIsBulkOpen(false);
                            setBulkPreviewCards([]);
                          }}
                          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
                        >
                          {t('cancel')}
                        </button>
                        <button
                          type="button"
                          onClick={handleBulkSave}
                          disabled={isBulkSaving}
                          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                        >
                          {isBulkSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                          {t('bulkGenerateSaveAll')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function normalizeBulkCount(value: string) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return 5;
  }

  return Math.min(20, Math.max(1, parsed));
}
