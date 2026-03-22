import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'qqify - Quinquatria Portraits',
  description: 'Transform your photos into Quinquatria-inspired portraits celebrating Minerva and Roman festival aesthetics.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body className="font-sans bg-stone-50 text-stone-900 antialiased" suppressHydrationWarning>{children}</body>
    </html>
  );
}
