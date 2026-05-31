'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { Input } from '@/components/ui';

interface SearchableRelationPickerOption {
  value: string;
  label: string;
}

interface SearchableRelationPickerProps {
  value: string;
  onChange: (value: string) => void;
  options: SearchableRelationPickerOption[];
  placeholder: string;
  searchPlaceholder: string;
  emptyMessage: string;
  className?: string;
  disabled?: boolean;
}

export function SearchableRelationPicker({
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  className,
  disabled,
}: SearchableRelationPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedLabel = options.find((option) => option.value === value)?.label ?? placeholder;

  const filteredOptions = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return options;
    return options.filter((option) => option.label.toLowerCase().includes(keyword));
  }, [options, search]);

  return (
    <div className={`relative ${className ?? ''}`}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((current) => !current)}
        onBlur={(event) => {
          if (!event.currentTarget.parentElement?.contains(event.relatedTarget as Node)) {
            setOpen(false);
            setSearch('');
          }
        }}
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm"
        disabled={disabled}
      >
        <span className="truncate text-left">{selectedLabel}</span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-2 shadow-md">
          <div className="mb-2 flex h-9 items-center rounded-md border border-input bg-background">
            <Search className="ml-2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-full border-0 bg-transparent px-2 py-0 text-sm shadow-none focus-visible:ring-0"
              autoFocus
            />
          </div>
          <div className="max-h-56 overflow-y-auto" role="listbox">
            {filteredOptions.length === 0 ? (
              <p className="px-2 py-1.5 text-sm text-muted-foreground">{emptyMessage}</p>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={value === option.value}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                    setSearch('');
                  }}
                  className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
                >
                  <span className="truncate">{option.label}</span>
                  {value === option.value ? <Check className="ml-2 h-4 w-4 text-primary" /> : null}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
