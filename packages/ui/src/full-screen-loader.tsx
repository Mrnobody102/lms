import { Loader2 } from 'lucide-react';
import { cn } from './lib/utils';
import { useEffect, useState } from 'react';

export interface FullScreenLoaderProps {
  isOpen: boolean;
  text?: string;
  className?: string;
}

export function FullScreenLoader({ isOpen, text, className }: FullScreenLoaderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm transition-all duration-300',
        className,
      )}
    >
      <div className="flex flex-col items-center justify-center space-y-4 animate-in fade-in zoom-in duration-300">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        {text && <p className="text-sm font-medium text-muted-foreground">{text}</p>}
      </div>
    </div>
  );
}
