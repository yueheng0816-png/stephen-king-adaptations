'use client';

import { useLanguage } from '@/lib/i18n';

/** Renders the review markdown, picking language-appropriate content */
export function ReviewRenderer({
  reviewZh,
  reviewEn,
}: {
  reviewZh: string | null;
  reviewEn: string | null;
}) {
  const { lang } = useLanguage();
  const text = lang === 'zh' ? reviewZh : reviewEn;

  if (!text) {
    return (
      <p className="text-muted-foreground">
        {lang === 'zh' ? '中文评价即将上线。' : 'English review coming soon.'}
      </p>
    );
  }

  return (
    <>
      {text.split('\n').map((line, i) => {
        if (line.startsWith('## ')) {
          return <h3 key={i} className="text-lg font-semibold mt-6 mb-2">{line.slice(3)}</h3>;
        }
        if (line.startsWith('**') && line.endsWith('**')) {
          return <p key={i} className="font-semibold mt-4">{line.slice(2, -2)}</p>;
        }
        if (line.startsWith('- ')) {
          return <li key={i} className="text-muted-foreground ml-4">{line.slice(2)}</li>;
        }
        if (line.trim()) {
          return <p key={i} className="text-muted-foreground leading-relaxed">{line}</p>;
        }
        return null;
      })}
    </>
  );
}

/** Renders book differences with English labels in EN mode */
export function DiffRenderer({
  differences,
}: {
  differences: Array<{
    id: string;
    category: string;
    description: string;
    descriptionEn: string | null;
  }>;
}) {
  const { lang } = useLanguage();

  const catLabels: Record<string, { en: string; zh: string }> = {
    ENDING: { en: 'Ending', zh: '结局' },
    CHARACTER: { en: 'Characters', zh: '角色' },
    PLOT: { en: 'Plot', zh: '情节' },
    TONE: { en: 'Tone', zh: '基调' },
    CUT_CONTENT: { en: 'Cut Content', zh: '删减内容' },
  };

  return (
    <>
      {differences.map(d => (
        <div key={d.id} className="p-4 rounded-lg border bg-card">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            {lang === 'zh' ? catLabels[d.category]?.zh : catLabels[d.category]?.en || d.category}
          </span>
          <p className="text-sm text-muted-foreground mt-2">
            {lang === 'zh' ? d.description : (d.descriptionEn || d.description)}
          </p>
        </div>
      ))}
    </>
  );
}
