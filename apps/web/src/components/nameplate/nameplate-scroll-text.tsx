import { memo, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';

type NameplateTextTag = 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

type NameplateScrollVars = CSSProperties & {
  '--nameplate-text-scroll-distance'?: string;
  '--nameplate-text-scroll-duration'?: string;
};

export interface NameplateScrollTextProps {
  readonly as?: NameplateTextTag;
  readonly text: string;
  readonly className?: string;
  readonly textClassName?: string;
  readonly textStyle?: CSSProperties;
  readonly overlay?: ReactNode;
  readonly title?: string;
}

const MIN_SCROLL_OVERFLOW = 4;

function getScrollDuration(text: string, overflow: number): number {
  const byTextLength = text.length * 0.34;
  const byOverflow = overflow / 18;
  return Math.min(18, Math.max(7, byTextLength, byOverflow));
}

export const NameplateScrollText = memo(function NameplateScrollText({
  as: Tag = 'span',
  text,
  className,
  textClassName,
  textStyle,
  overlay,
  title,
}: NameplateScrollTextProps) {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLElement | null>(null);
  const textRef = useRef<HTMLSpanElement | null>(null);
  const [overflowAmount, setOverflowAmount] = useState(0);
  const setContainerNode = (node: HTMLElement | null) => {
    containerRef.current = node;
  };

  useLayoutEffect(() => {
    const container = containerRef.current;
    const textNode = textRef.current;
    if (!container || !textNode) return undefined;

    const measure = () => {
      const nextOverflow = Math.max(0, Math.ceil(textNode.scrollWidth - container.clientWidth));
      setOverflowAmount((previous) => (previous === nextOverflow ? previous : nextOverflow));
    };

    measure();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }

    const observer = new ResizeObserver(measure);
    observer.observe(container);
    observer.observe(textNode);
    return () => observer.disconnect();
  }, [text]);

  const canScroll = overflowAmount > MIN_SCROLL_OVERFLOW && !prefersReducedMotion;
  const containerStyle: NameplateScrollVars = {
    '--nameplate-text-scroll-distance': `${overflowAmount}px`,
    '--nameplate-text-scroll-duration': `${getScrollDuration(text, overflowAmount)}s`,
  };

  return (
    <Tag
      ref={setContainerNode}
      className={cn(
        'nameplate-scroll-text',
        canScroll && 'nameplate-scroll-text--scrolling',
        className
      )}
      style={containerStyle}
      title={title ?? text}
      data-nameplate-text-overflow={canScroll ? 'scroll' : 'clip'}
    >
      {overlay}
      <span
        ref={textRef}
        className={cn('nameplate-scroll-text__inner', textClassName)}
        style={textStyle}
      >
        {text}
      </span>
    </Tag>
  );
});
