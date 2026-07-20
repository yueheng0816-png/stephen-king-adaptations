import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ClientProviders } from '@/components/layout/client-providers';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { generateDefaultMetadata } from '@/lib/seo';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = generateDefaultMetadata();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased
          bg-background text-foreground min-h-screen flex flex-col`}
      >
        <ClientProviders>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </ClientProviders>
      </body>
    </html>
  );
}
