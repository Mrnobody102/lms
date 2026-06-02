'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  BookOpen,
  BrainCircuit,
  Layers3,
  Pencil,
  Plus,
  Search,
  Tags,
  Trash2,
  Wand2,
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AuthRequiredPanel } from '@/components/auth/auth-required-panel';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { StudentNav } from '@/components/layout/student-nav';
import { SrsStatsChart } from '@/components/srs/srs-stats-chart';
import { useAuthStore } from '@/features/auth/auth.store';
import { useCourse, useCourses } from '@/hooks/use-courses';
import {
  useCreateCustomCard,
  useCustomCards,
  useDeleteCustomCard,
  useUpdateCustomCard,
} from '@/hooks/use-srs';
import type { ReviewCard } from '@/lib/srs-api';
import { defaultApiClient as api } from '@repo/api-client';
import { Link } from '@/navigation';

const CUSTOM_CARDS_PAGE_SIZE = 25;
const DEFAULT_DECK = 'General';
const UNCATEGORIZED_DECK = 'Unorganized';
const CARD_CATEGORIES = ['vocabulary', 'grammar', 'phrase', 'concept'] as const;
type CardCategory = (typeof CARD_CATEGORIES)[number];

export default function CustomCardsPage() {
  const t = useTranslations('Student.srs.customCards');
  const { isAuthenticated, isInitialized } = useAuthStore();
  const { data: cards, isLoading } = useCustomCards(isAuthenticated);
  const { data: courseData } = useCourses({ limit: 100 }, isAuthenticated);
  const createCard = useCreateCustomCard();
  const updateCard = useUpdateCustomCard();
  const deleteCard = useDeleteCustomCard();

  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    front: '',
    back: '',
    phonetics: '',
    example: '',
    deck: DEFAULT_DECK,
    category: 'vocabulary' as CardCategory,
    courseId: '',
    unitId: '',
    tags: '',
    skillCode: '',
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkData, setBulkData] = useState({
    topic: '',
    count: '5',
    context: '',
    deck: '',
    category: 'vocabulary' as CardCategory,
    courseId: '',
    unitId: '',
    tags: '',
  });
  const { data: selectedCourseDetail } = useCourse(
    formData.courseId,
    isAuthenticated && Boolean(formData.courseId),
  );
  const { data: selectedBulkCourseDetail } = useCourse(
    bulkData.courseId,
    isAuthenticated && Boolean(bulkData.courseId),
  );
  const [bulkPreviewCards, setBulkPreviewCards] = useState<
    { front: string; back: string; phonetics: string; example: string }[]
  >([]);
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  const [visibleCardsCount, setVisibleCardsCount] = useState(CUSTOM_CARDS_PAGE_SIZE);
  const [searchQuery, setSearchQuery] = useState('');
  const [deckFilter, setDeckFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');

  const customCards = useMemo(() => cards ?? [], [cards]);
  const courses = useMemo(() => courseData?.data ?? [], [courseData?.data]);
  const selectedCourse =
    selectedCourseDetail ?? courses.find((course) => course.id === formData.courseId);
  const selectedBulkCourse =
    selectedBulkCourseDetail ?? courses.find((course) => course.id === bulkData.courseId);
  const unitOptions = selectedCourse?.units ?? [];
  const bulkUnitOptions = selectedBulkCourse?.units ?? [];
  const deckOptions = useMemo(() => {
    return Array.from(
      new Set(customCards.map((card) => getCardDeck(card)).filter((deck) => deck.length > 0)),
    ).sort((first, second) => first.localeCompare(second));
  }, [customCards]);
  const courseFilterOptions = useMemo(() => {
    return Array.from(
      new Map(
        customCards
          .map((card) => {
            const content = card.customContent;
            const title = content?.courseTitle?.trim();
            if (!title) return null;
            return [content?.courseId || title, title] as const;
          })
          .filter((entry): entry is readonly [string, string] => Boolean(entry)),
      ).entries(),
    ).sort((first, second) => first[1].localeCompare(second[1]));
  }, [customCards]);
  const filteredCards = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return customCards.filter((card) => {
      const content = card.customContent;
      const searchable = [
        content?.front,
        content?.back,
        content?.example,
        getCardDeck(card),
        content?.category,
        content?.courseTitle,
        content?.unitTitle,
        ...(content?.tags ?? []),
        ...(card.skillCodes ?? []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const matchesSearch = !query || searchable.includes(query);
      const matchesDeck = deckFilter === 'all' || getCardDeck(card) === deckFilter;
      const matchesCategory = categoryFilter === 'all' || content?.category === categoryFilter;
      const matchesCourse =
        courseFilter === 'all' ||
        content?.courseId === courseFilter ||
        content?.courseTitle === courseFilter;

      return matchesSearch && matchesDeck && matchesCategory && matchesCourse;
    });
  }, [categoryFilter, courseFilter, customCards, deckFilter, searchQuery]);
  const visibleCards = filteredCards.slice(0, visibleCardsCount);
  const hasMoreCards = filteredCards.length > visibleCards.length;
  const deckCount = deckOptions.length;
  const linkedCourseCount = courseFilterOptions.length;

  useEffect(() => {
    setVisibleCardsCount(CUSTOM_CARDS_PAGE_SIZE);
  }, [categoryFilter, courseFilter, deckFilter, searchQuery]);

  const resetForm = () => {
    setFormData({
      front: '',
      back: '',
      phonetics: '',
      example: '',
      deck: DEFAULT_DECK,
      category: 'vocabulary',
      courseId: '',
      unitId: '',
      tags: '',
      skillCode: '',
    });
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
      deck: customContent?.deck || DEFAULT_DECK,
      category: normalizeCategory(customContent?.category),
      courseId: customContent?.courseId || '',
      unitId: customContent?.unitId || '',
      tags: customContent?.tags?.join(', ') || '',
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
    const course = selectedCourse;
    const unit = unitOptions.find((item) => item.id === formData.unitId);
    const payload = {
      customContent: {
        front: formData.front.trim(),
        back: formData.back.trim(),
        phonetics: formData.phonetics.trim(),
        example: formData.example.trim(),
        deck: normalizeDeck(formData.deck),
        category: formData.category,
        courseId: course?.id,
        courseTitle: course?.title,
        unitId: unit?.id,
        unitTitle: unit?.title,
        tags: parseTags(formData.tags),
      },
      skillCodes: formData.skillCode.trim() ? [formData.skillCode.trim()] : [],
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
    const bulkUnit = bulkUnitOptions.find((unit) => unit.id === bulkData.unitId);
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
              deck: normalizeDeck(bulkData.deck || bulkData.topic),
              category: bulkData.category,
              courseId: selectedBulkCourse?.id,
              courseTitle: selectedBulkCourse?.title,
              unitId: bulkUnit?.id,
              unitTitle: bulkUnit?.title,
              tags: parseTags(bulkData.tags),
            },
            skillCodes: parseTags(bulkData.tags),
          }),
        ),
      );
      setBulkPreviewCards([]);
      setBulkData({
        topic: '',
        count: '5',
        context: '',
        deck: '',
        category: 'vocabulary',
        courseId: '',
        unitId: '',
        tags: '',
      });
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

      <main className="flex-1 mx-auto max-w-6xl px-6 py-12 w-full">
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

            <div className="mb-6 grid gap-3 md:grid-cols-3">
              <CardMetric
                icon={BrainCircuit}
                label={t('totalCards')}
                value={customCards.length.toLocaleString()}
              />
              <CardMetric icon={Layers3} label={t('deckCount')} value={deckCount.toString()} />
              <CardMetric
                icon={BookOpen}
                label={t('linkedCourses')}
                value={linkedCourseCount.toString()}
              />
            </div>

            <div className="mb-6 rounded-xl border bg-card p-4">
              <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_180px_180px_220px]">
                <label className="relative block min-w-0">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder={t('searchPlaceholder')}
                    aria-label={t('searchPlaceholder')}
                    className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none ring-primary/20 focus:ring-2"
                  />
                </label>
                <select
                  value={deckFilter}
                  onChange={(event) => setDeckFilter(event.target.value)}
                  aria-label={t('filterDeck')}
                  className="h-10 rounded-md border bg-background px-3 text-sm outline-none ring-primary/20 focus:ring-2"
                >
                  <option value="all">{t('allDecks')}</option>
                  {deckOptions.map((deck) => (
                    <option key={deck} value={deck}>
                      {deck}
                    </option>
                  ))}
                </select>
                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  aria-label={t('filterCategory')}
                  className="h-10 rounded-md border bg-background px-3 text-sm outline-none ring-primary/20 focus:ring-2"
                >
                  <option value="all">{t('allCategories')}</option>
                  {CARD_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {t(`category.${category}`)}
                    </option>
                  ))}
                </select>
                <select
                  value={courseFilter}
                  onChange={(event) => setCourseFilter(event.target.value)}
                  aria-label={t('filterCourse')}
                  className="h-10 rounded-md border bg-background px-3 text-sm outline-none ring-primary/20 focus:ring-2"
                >
                  <option value="all">{t('allCourses')}</option>
                  {courseFilterOptions.map(([courseId, title]) => (
                    <option key={courseId} value={courseId}>
                      {title}
                    </option>
                  ))}
                </select>
              </div>
              {deckFilter !== 'all' || courseFilter !== 'all' ? (
                <div className="mt-3 flex justify-end">
                  <Link
                    href={
                      deckFilter !== 'all'
                        ? `/review?deck=${encodeURIComponent(deckFilter)}`
                        : `/review?courseId=${encodeURIComponent(courseFilter)}`
                    }
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
                  >
                    <BrainCircuit className="h-4 w-4" />
                    {t('studyFilteredSet')}
                  </Link>
                </div>
              ) : null}
            </div>

            <div className="space-y-4">
              {!isInitialized || isLoading ? (
                <div className="py-12 text-center text-muted-foreground animate-pulse">
                  {t('loading')}
                </div>
              ) : customCards.length === 0 ? (
                <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
                  <BrainCircuit className="mx-auto h-12 w-12 opacity-20 mb-4" />
                  <p>{t('noCards')}</p>
                </div>
              ) : filteredCards.length === 0 ? (
                <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
                  <Search className="mx-auto h-12 w-12 opacity-20 mb-4" />
                  <p>{t('noFilteredCards')}</p>
                </div>
              ) : (
                <>
                  {visibleCards.map((card) => {
                    const content = card.customContent;
                    const deck = getCardDeck(card);
                    const category = normalizeCategory(content?.category);
                    return (
                      <div
                        key={card.id}
                        className="group flex flex-col justify-between rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                              <Layers3 className="h-3 w-3" />
                              {deck}
                            </span>
                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                              {t(`category.${category}`)}
                            </span>
                            {content?.courseTitle ? (
                              <span className="inline-flex max-w-[260px] items-center gap-1 truncate rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                <BookOpen className="h-3 w-3 shrink-0" />
                                <span className="truncate">
                                  {content.unitTitle
                                    ? `${content.courseTitle} / ${content.unitTitle}`
                                    : content.courseTitle}
                                </span>
                              </span>
                            ) : null}
                          </div>
                          <div className="flex items-baseline gap-3 mb-1">
                            <h3 className="truncate text-lg font-bold">{content?.front}</h3>
                            {content?.phonetics && (
                              <span className="text-sm font-medium text-primary">
                                {content.phonetics}
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
                          {content?.tags?.length ? (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {content.tags.slice(0, 4).map((tag) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground"
                                >
                                  <Tags className="h-3 w-3" />
                                  {tag}
                                </span>
                              ))}
                            </div>
                          ) : null}
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
                  })}
                  {hasMoreCards && (
                    <div className="flex justify-center pt-2">
                      <button
                        type="button"
                        onClick={() =>
                          setVisibleCardsCount((count) => count + CUSTOM_CARDS_PAGE_SIZE)
                        }
                        className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
                      >
                        {t('showMoreCards', {
                          count: customCards.length - visibleCards.length,
                        })}
                      </button>
                    </div>
                  )}
                </>
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
                        <label className="mb-1 block text-sm font-medium">{t('deck')}</label>
                        <input
                          type="text"
                          required
                          value={formData.deck}
                          onChange={(e) => setFormData({ ...formData, deck: e.target.value })}
                          className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          placeholder={t('deckPlaceholder')}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium">
                          {t('categoryLabel')}
                        </label>
                        <select
                          value={formData.category}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              category: normalizeCategory(e.target.value),
                            })
                          }
                          className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        >
                          {CARD_CATEGORIES.map((category) => (
                            <option key={category} value={category}>
                              {t(`category.${category}`)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium">{t('course')}</label>
                        <select
                          value={formData.courseId}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              courseId: e.target.value,
                              unitId: '',
                            })
                          }
                          className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        >
                          <option value="">{t('noCourse')}</option>
                          {courses.map((course) => (
                            <option key={course.id} value={course.id}>
                              {course.title}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium">{t('unit')}</label>
                        <select
                          value={formData.unitId}
                          disabled={!formData.courseId || unitOptions.length === 0}
                          onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                          className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
                        >
                          <option value="">{t('noUnit')}</option>
                          {unitOptions.map((unit) => (
                            <option key={unit.id} value={unit.id}>
                              {unit.title}
                            </option>
                          ))}
                        </select>
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
                      <div>
                        <label className="mb-1 block text-sm font-medium">{t('tags')}</label>
                        <input
                          type="text"
                          value={formData.tags}
                          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                          className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          placeholder={t('tagsPlaceholder')}
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
                        <div>
                          <label className="mb-1 block text-sm font-medium">{t('deck')}</label>
                          <input
                            type="text"
                            value={bulkData.deck}
                            onChange={(e) => setBulkData({ ...bulkData, deck: e.target.value })}
                            className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            placeholder={t('bulkDeckPlaceholder')}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium">
                            {t('categoryLabel')}
                          </label>
                          <select
                            value={bulkData.category}
                            onChange={(e) =>
                              setBulkData({
                                ...bulkData,
                                category: normalizeCategory(e.target.value),
                              })
                            }
                            className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          >
                            {CARD_CATEGORIES.map((category) => (
                              <option key={category} value={category}>
                                {t(`category.${category}`)}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium">{t('course')}</label>
                          <select
                            value={bulkData.courseId}
                            onChange={(e) =>
                              setBulkData({
                                ...bulkData,
                                courseId: e.target.value,
                                unitId: '',
                              })
                            }
                            className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          >
                            <option value="">{t('noCourse')}</option>
                            {courses.map((course) => (
                              <option key={course.id} value={course.id}>
                                {course.title}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium">{t('unit')}</label>
                          <select
                            value={bulkData.unitId}
                            disabled={!bulkData.courseId || bulkUnitOptions.length === 0}
                            onChange={(e) => setBulkData({ ...bulkData, unitId: e.target.value })}
                            className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
                          >
                            <option value="">{t('noUnit')}</option>
                            {bulkUnitOptions.map((unit) => (
                              <option key={unit.id} value={unit.id}>
                                {unit.title}
                              </option>
                            ))}
                          </select>
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
                      <div>
                        <label className="mb-1 block text-sm font-medium">{t('tags')}</label>
                        <input
                          type="text"
                          value={bulkData.tags}
                          onChange={(e) => setBulkData({ ...bulkData, tags: e.target.value })}
                          className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          placeholder={t('tagsPlaceholder')}
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
                                  {t('front')}
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
                                  {t('back')}
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
                                  {t('phonetics')}
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
                                  {t('example')}
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

function CardMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </article>
  );
}

function getCardDeck(card: ReviewCard) {
  return normalizeDeck(card.customContent?.deck || UNCATEGORIZED_DECK);
}

function normalizeDeck(value: string) {
  const normalized = value.trim().replace(/\s+/g, ' ');
  return normalized || DEFAULT_DECK;
}

function normalizeCategory(value: string | undefined): CardCategory {
  return CARD_CATEGORIES.includes(value as CardCategory) ? (value as CardCategory) : 'vocabulary';
}

function parseTags(value: string) {
  return Array.from(
    new Set(
      value
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
        .slice(0, 12),
    ),
  );
}

function normalizeBulkCount(value: string) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return 5;
  }

  return Math.min(20, Math.max(1, parsed));
}
