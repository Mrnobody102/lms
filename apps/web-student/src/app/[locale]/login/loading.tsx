import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[50vh] animate-in fade-in duration-500">
      <Loader2 className="w-8 h-8 animate-spin text-primary opacity-50" />
    </div>
  );
}
