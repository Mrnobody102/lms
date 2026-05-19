'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AdminHeader } from '@/components/layout/admin-header';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AuthGuard } from '@/components/layout/auth-guard';
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Separator,
  Skeleton,
} from '@/components/ui';
import { AlertCircle, Edit2, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useCreateSkill, useDeleteSkill, useSkills, useUpdateSkill } from '@/hooks/use-skills';
import type { Skill } from '@/lib/skill-api';

interface FormState {
  code: string;
  name: string;
  nameVi: string;
  color: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
}

const emptyForm: FormState = {
  code: '',
  name: '',
  nameVi: '',
  color: '#22c55e',
  description: '',
  sortOrder: 0,
  isActive: true,
};

export default function SkillsPage() {
  const t = useTranslations('Admin');
  const { data: skills, isLoading, error } = useSkills(true);
  const createSkill = useCreateSkill();
  const updateSkill = useUpdateSkill();
  const deleteSkill = useDeleteSkill();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const sorted = useMemo(
    () =>
      [...(skills || [])].sort((a, b) => a.sortOrder - b.sortOrder || a.code.localeCompare(b.code)),
    [skills],
  );

  const errorMessage = error instanceof Error ? error.message : error ? String(error) : null;

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setOpen(true);
  };

  const openEdit = (skill: Skill) => {
    setEditingId(skill.id);
    setForm({
      code: skill.code,
      name: skill.name,
      nameVi: skill.nameVi || '',
      color: skill.color || '#22c55e',
      description: skill.description || '',
      sortOrder: skill.sortOrder,
      isActive: skill.isActive,
    });
    setFormError(null);
    setOpen(true);
  };

  const handleSubmit = async () => {
    setFormError(null);
    try {
      if (editingId) {
        await updateSkill.mutateAsync({
          id: editingId,
          data: {
            name: form.name,
            nameVi: form.nameVi || undefined,
            color: form.color,
            description: form.description || undefined,
            sortOrder: form.sortOrder,
            isActive: form.isActive,
          },
        });
      } else {
        await createSkill.mutateAsync({
          code: form.code,
          name: form.name,
          nameVi: form.nameVi || undefined,
          color: form.color,
          description: form.description || undefined,
          sortOrder: form.sortOrder,
          isActive: form.isActive,
        });
      }
      setOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('skills.errorSave');
      setFormError(message);
    }
  };

  const handleDelete = async (skill: Skill) => {
    if (!window.confirm(t('skills.confirmDelete', { code: skill.code }))) return;
    try {
      await deleteSkill.mutateAsync(skill.id);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : t('skills.errorDelete'));
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen flex bg-background">
        <AdminSidebar />
        <main className="flex-1 md:ml-64 p-6 lg:p-8">
          <div className="max-w-5xl mx-auto">
            <AdminHeader title={t('skills.title')} description={t('skills.titleDesc')} />

            <div className="flex justify-end mb-6">
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4 mr-2" />
                {t('skills.create')}
              </Button>
            </div>

            <Separator className="mb-6" />

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : errorMessage ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            ) : sorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{t('skills.empty')}</h3>
                <p className="text-sm text-muted-foreground max-w-sm mb-6">
                  {t('skills.emptyDesc')}
                </p>
                <Button onClick={openCreate}>{t('skills.create')}</Button>
              </div>
            ) : (
              <div className="rounded-xl border bg-card divide-y">
                {sorted.map((skill) => (
                  <div
                    key={skill.id}
                    className="flex items-center gap-4 px-5 py-4"
                    data-testid={`skill-row-${skill.code}`}
                  >
                    <div
                      className="h-10 w-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: skill.color || '#94a3b8', color: '#fff' }}
                    >
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-semibold bg-muted px-1.5 py-0.5 rounded">
                          {skill.code}
                        </span>
                        <span className="font-medium truncate">{skill.name}</span>
                        {skill.nameVi ? (
                          <span className="text-sm text-muted-foreground truncate">
                            · {skill.nameVi}
                          </span>
                        ) : null}
                        {!skill.isActive ? (
                          <Badge variant="secondary">{t('skills.statusInactive')}</Badge>
                        ) : null}
                      </div>
                      {skill.description ? (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {skill.description}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(skill)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(skill)}
                        disabled={deleteSkill.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingId ? t('skills.editTitle') : t('skills.createTitle')}
                  </DialogTitle>
                  <DialogDescription>{t('skills.formHint')}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div>
                    <Label htmlFor="skill-code">{t('skills.code')}</Label>
                    <Input
                      id="skill-code"
                      value={form.code}
                      placeholder="VOCABULARY"
                      disabled={!!editingId}
                      onChange={(e) =>
                        setForm((s) => ({
                          ...s,
                          code: e.target.value.toUpperCase().replace(/\s+/g, '_'),
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="skill-name">{t('skills.name')}</Label>
                    <Input
                      id="skill-name"
                      value={form.name}
                      onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="skill-name-vi">{t('skills.nameVi')}</Label>
                    <Input
                      id="skill-name-vi"
                      value={form.nameVi}
                      onChange={(e) => setForm((s) => ({ ...s, nameVi: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="skill-color">{t('skills.color')}</Label>
                      <Input
                        id="skill-color"
                        type="color"
                        value={form.color}
                        onChange={(e) => setForm((s) => ({ ...s, color: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="skill-sort">{t('skills.sortOrder')}</Label>
                      <Input
                        id="skill-sort"
                        type="number"
                        min={0}
                        value={form.sortOrder}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, sortOrder: Number(e.target.value) || 0 }))
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="skill-desc">{t('skills.description')}</Label>
                    <Input
                      id="skill-desc"
                      value={form.description}
                      onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id="skill-active"
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm((s) => ({ ...s, isActive: e.target.checked }))}
                    />
                    <Label htmlFor="skill-active" className="!mt-0">
                      {t('skills.active')}
                    </Label>
                  </div>
                  {formError ? (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{formError}</AlertDescription>
                    </Alert>
                  ) : null}
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setOpen(false)}>
                    {t('skills.cancel')}
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={
                      createSkill.isPending ||
                      updateSkill.isPending ||
                      !form.name.trim() ||
                      (!editingId && !form.code.trim())
                    }
                  >
                    {editingId ? t('skills.save') : t('skills.create')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
