
import type {Metadata} from 'next';
import './globals.css';
import LiquidBackground from '@/components/layout/LiquidBackground';

export const metadata: Metadata = {
  title: 'Martial Grid | Elite Tournament Management',
  description: 'Next-gen multi-sport tournament management.',
  icons: {
    icon: '/icon.png', // Or '/icon.svg'
    apple: '/apple-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" style={{ colorScheme: 'light' }}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen relative">
        <LiquidBackground />
        <div className="relative z-10 flex flex-col min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
