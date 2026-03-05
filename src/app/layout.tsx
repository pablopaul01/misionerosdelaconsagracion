import type { Metadata } from 'next';
import { Cinzel } from 'next/font/google';
import { QueryProvider } from '@/components/providers/QueryProvider';
import './globals.css';

const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-cinzel',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Misioneros de la Consagración',
  description: 'Plataforma de gestión del movimiento Misioneros de la Consagración',
  icons: { icon: '/fav.png' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={cinzel.variable}>
      <body className="bg-brand-cream font-body antialiased">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
