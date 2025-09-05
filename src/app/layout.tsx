import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Remote Control Android',
  description: 'Professional remote management solution for Android devices with transparent monitoring and secure control.',
  keywords: 'android, remote control, device management, monitoring, security',
  authors: [{ name: 'Remote Control Android Team' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'noindex, nofollow', // Demo app - should not be indexed
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#7c3aed" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body 
        className={`${inter.className} antialiased`}
        suppressHydrationWarning
      >
        <div id="root">
          {children}
        </div>
        
        {/* Development notification */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-2 rounded-lg text-xs shadow-lg z-50">
            <div className="font-medium">Development Mode</div>
            <div>Demo application for educational purposes</div>
          </div>
        )}
      </body>
    </html>
  );
}