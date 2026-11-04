import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'InfographAI — Daily LinkedIn Infographics, Automated',
  description: 'AI-powered platform that researches trending tech topics, generates professional infographics, and auto-publishes to LinkedIn every morning.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className} style={{ background: '#0f172a' }}>
        {children}
      </body>
    </html>
  );
}
