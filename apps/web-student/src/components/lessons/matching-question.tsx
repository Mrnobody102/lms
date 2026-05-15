import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface MatchingQuestionProps {
  options: { left: string[]; right: string[] };
  value: string; // JSON stringified Record<string, string>
  disabled: boolean;
  onChange: (value: string) => void;
}

export function MatchingQuestion({ options, value, disabled, onChange }: MatchingQuestionProps) {
  const t = useTranslations('Student');
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);

  // Parse existing value
  let mapping: Record<string, string> = {};
  try {
    if (value) mapping = JSON.parse(value);
  } catch (_e) {
    mapping = {};
  }

  const { left = [], right = [] } = options;

  const handleLeftClick = (leftItem: string) => {
    if (disabled) return;
    if (selectedLeft === leftItem) {
      setSelectedLeft(null);
    } else {
      setSelectedLeft(leftItem);
    }
  };

  const handleRightClick = (rightItem: string) => {
    if (disabled || !selectedLeft) return;

    // Remove any existing mapping for the selected left item
    // and for the selected right item (if it's already mapped to something else)
    const newMapping = { ...mapping };

    // Remove if rightItem is already mapped to another leftItem
    Object.keys(newMapping).forEach((key) => {
      if (newMapping[key] === rightItem) {
        delete newMapping[key];
      }
    });

    newMapping[selectedLeft] = rightItem;
    onChange(JSON.stringify(newMapping));
    setSelectedLeft(null);
  };

  const handleUnmap = (leftItem: string) => {
    if (disabled) return;
    const newMapping = { ...mapping };
    delete newMapping[leftItem];
    onChange(JSON.stringify(newMapping));
  };

  return (
    <div className="mt-4">
      <p className="mb-4 text-sm text-muted-foreground">
        {t('practice.matchingInstruction', {
          fallback: 'Click a left item, then click a right item to match them.',
        })}
      </p>
      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-3">
          {left.map((leftItem) => {
            const isSelected = selectedLeft === leftItem;
            const isMapped = mapping[leftItem] !== undefined;

            return (
              <div
                key={leftItem}
                onClick={() => !isMapped && handleLeftClick(leftItem)}
                className={`flex items-center justify-between min-h-[3rem] px-4 py-2 border rounded-md transition-all cursor-pointer ${
                  disabled
                    ? 'opacity-60 cursor-not-allowed'
                    : isMapped
                      ? 'border-emerald-500 bg-emerald-500/10 cursor-default'
                      : isSelected
                        ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                        : 'hover:border-primary/50 hover:bg-muted'
                }`}
              >
                <span className="text-sm font-medium">{leftItem}</span>
                {isMapped && !disabled && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnmap(leftItem);
                    }}
                    className="text-xs text-destructive hover:underline ml-2"
                  >
                    Unmatch
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <div className="space-y-3">
          {right.map((rightItem) => {
            const mappedLeftItem = Object.keys(mapping).find((key) => mapping[key] === rightItem);
            const isMapped = mappedLeftItem !== undefined;

            return (
              <div
                key={rightItem}
                onClick={() => handleRightClick(rightItem)}
                className={`flex flex-col justify-center min-h-[3rem] px-4 py-2 border rounded-md transition-all ${
                  disabled
                    ? 'opacity-60 cursor-not-allowed'
                    : selectedLeft && !isMapped
                      ? 'cursor-pointer hover:border-primary/50 hover:bg-muted ring-1 ring-primary/20'
                      : isMapped
                        ? 'border-emerald-500 bg-emerald-500/10 cursor-default'
                        : 'cursor-not-allowed opacity-50 bg-muted/30'
                }`}
              >
                <span className="text-sm">{rightItem}</span>
                {isMapped && (
                  <span className="text-xs font-semibold text-emerald-600 mt-1">
                    Matched with: {mappedLeftItem}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
