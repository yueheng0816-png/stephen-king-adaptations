'use client';

import { useLanguage } from '@/lib/i18n';

/**
 * Bilingual text — renders both languages in HTML (good for SEO),
 * but shows only the selected language via CSS.
 */
export function LangText({
  en,
  zh,
  className,
  tag: Tag = 'span',
}: {
  en: string | null;
  zh: string | null;
  className?: string;
  tag?: 'span' | 'p' | 'div' | 'h1' | 'h2' | 'h3';
}) {
  const { lang } = useLanguage();

  // Only render if at least one language has content
  if (!en && !zh) return null;

  return (
    <Tag className={className}>
      {/* Show Chinese when lang=zh AND zh text exists */}
      {zh && <span className={lang === 'zh' ? '' : 'hidden'}>{zh}</span>}
      {/* Show English when lang=en OR no Chinese available */}
      {(!zh || lang === 'en') && <span className={lang === 'en' || !zh ? '' : 'hidden'}>{en}</span>}
    </Tag>
  );
}

/**
 * Conditionally renders its children based on language.
 * Use for larger content blocks (reviews, overviews).
 */
export function LangBlock({
  en,
  zh,
}: {
  en: React.ReactNode;
  zh: React.ReactNode;
}) {
  const { lang } = useLanguage();
  if (lang === 'zh') return <>{zh}</>;
  return <>{en}</>;
}
