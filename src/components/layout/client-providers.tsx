'use client';

import { ThemeProvider } from 'next-themes';
import { LanguageProvider } from '@/lib/i18n';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <LanguageProvider>
        {children}
      </LanguageProvider>
    </ThemeProvider>
  );
}
