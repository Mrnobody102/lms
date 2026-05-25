'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

interface ChartDimensions {
  height: number;
  width: number;
}

interface MeasuredChartProps {
  children: (dimensions: ChartDimensions) => ReactNode;
  className?: string;
  fallbackHeight?: number;
}

export function MeasuredChart({ children, className, fallbackHeight = 300 }: MeasuredChartProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<ChartDimensions | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return undefined;
    }

    const measure = () => {
      const rect = element.getBoundingClientRect();
      const width = Math.floor(rect.width);
      const height = Math.floor(rect.height || fallbackHeight);

      if (width > 0 && height > 0) {
        setDimensions((current) =>
          current?.width === width && current.height === height ? current : { width, height },
        );
      }
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(element);

    return () => observer.disconnect();
  }, [fallbackHeight]);

  return (
    <div ref={ref} className={className}>
      {dimensions ? children(dimensions) : null}
    </div>
  );
}
