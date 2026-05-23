'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, BrainCircuit, Pencil, Plus, Trash2 } from 'lucide-react';
import { StudentNav } from '@/components/layout/student-nav';
import { SrsStatsChart } from '@/components/srs/srs-stats-chart';
import {
  useCreateCustomCard,
  useCustomCards,
  useDeleteCustomCard,
  useUpdateCustomCard,
} from '@/hooks/use-srs';
import type { ReviewCard } from '@/lib/srs-api';
import { Link } from '@/navigation';

export default function CustomCardsPage() {
  const t = useTranslations('Student.srs.customCards');
  const { data: cards, isLoading } = useCustomCards();
  const createCard = useCreateCustomCard();
  const updateCard = useUpdateCustomCard();
  const deleteCard = useDeleteCustomCard();

  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    front: '',
    back: '',
    pinyin: '',
    example: '',
    skillCode: '',
  });

  const [isFormOpen, setIsFormOpen] = useState(false);

  const resetForm = () => {
    setFormData({ front: '', back: '', pinyin: '', example: '', skillCode: '' });
    setEditingCardId(null);
    setIsFormOpen(false);
  };

  const handleEdit = (card: ReviewCard) => {
    const customContent = card.customContent;
    setFormData({
      front: customContent?.front || '',
      back: customContent?.back || '',
      pinyin: customContent?.pinyin || '',
      example: customContent?.example || '',
      skillCode: card.skillCodes?.[0] || '',
    });
    setEditingCardId(card.id);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm(t('deleteConfirm'))) {
      deleteCard.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      customContent: {
        front: formData.front,
        back: formData.back,
        pinyin: formData.pinyin,
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

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col">
      <StudentNav showLinks />

      <main className="flex-1 mx-auto max-w-4xl px-6 py-12 w-full">
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
          <button
            onClick={() => setIsFormOpen(true)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            {t('addCard')}
          </button>
        </div>

        <div className="mb-8">
          <SrsStatsChart />
        </div>

        {isFormOpen && (
          <div className="mb-8 rounded-xl border bg-card p-6 shadow-sm animate-in fade-in slide-in-from-top-4">
            <h2 className="text-lg font-bold mb-4">{editingCardId ? t('edit') : t('addCard')}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">{t('front')}</label>
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
                  <label className="mb-1 block text-sm font-medium">{t('pinyin')}</label>
                  <input
                    type="text"
                    value={formData.pinyin}
                    onChange={(e) => setFormData({ ...formData, pinyin: e.target.value })}
                    className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder={t('pinyinPlaceholder')}
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
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={createCard.isPending || updateCard.isPending}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {isLoading ? (
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
                      {content?.pinyin && (
                        <span className="text-sm font-medium text-primary">{content.pinyin}</span>
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
                    <button
                      onClick={() => handleDelete(card.id)}
                      className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-500/10 rounded-md transition-colors"
                      title={t('delete')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
