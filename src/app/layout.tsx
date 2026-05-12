import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({ variable: '--font-inter', subsets: ['latin'] });
const mono = JetBrains_Mono({ variable: '--font-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Línea Oculta — Análisis Deportivo',
  description: 'Detecta valor real en el mercado de fútbol.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${mono.variable} h-full`}>
      <body className="min-h-full bg-[#0A0A0A] text-[#F2F2F2] antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
