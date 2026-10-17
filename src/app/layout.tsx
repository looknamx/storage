import type { Metadata } from 'next';
import { Noto_Sans_Thai } from 'next/font/google';
import './globals.css';
import AppShell from '@/components/layout/AppShell';

const notoSansThai = Noto_Sans_Thai({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-noto-sans-thai',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ศูนย์กลางระบบสารสนเทศองค์กร (Enterprise Portal)',
  description: 'ศูนย์กลางระบบสารสนเทศองค์กร - ระบบแผนงานซ่อมบำรุง, ระบบแผนงานการตลาด และระบบแผนงานฝ่ายจัดซื้อ',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={`${notoSansThai.variable} h-full`}>
      <body className={`${notoSansThai.className} min-h-full antialiased`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
