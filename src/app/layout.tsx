import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { JetBrains_Mono } from 'next/font/google';
import { Sidebar } from '@/components/layout/Sidebar';
import { RightPanel } from '@/components/layout/RightPanel';
import './globals.css';

const inter = Inter({ variable: '--font-inter', subsets: ['latin'] });
const mono = JetBrains_Mono({ variable: '--font-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Línea Oculta — Análisis Deportivo',
  description: 'Detecta valor real en el mercado de fútbol.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${mono.variable} h-full`}>
      <body className="h-full antialiased font-sans overflow-hidden">
        <div className="noise-overlay" />
        {/* Mobile: single column scrollable */}
        {/* Tablet (md): sidebar + center */}
        {/* Desktop (xl): sidebar + center + right panel */}
        <div className="relative flex h-full z-10">
          {/* Sidebar — hidden on mobile, visible md+ */}
          <div className="hidden md:flex md:w-[200px] xl:w-[220px] flex-shrink-0 flex-col h-full">
            <Sidebar />
          </div>

          {/* Center — always visible */}
          <main className="flex-1 min-w-0 overflow-y-auto">
            {children}
          </main>

          {/* Right panel — hidden on mobile & tablet, visible xl+ */}
          <div className="hidden xl:flex xl:w-[280px] flex-shrink-0 flex-col h-full">
            <RightPanel />
          </div>
        </div>
      </body>
    </html>
  );
}
