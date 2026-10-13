import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '@/app/globals.css';
import { Providers } from './providers';

const SITE_URL = 'https://bouncypitch.github.io/compass-company-brain/';
const TITLE = 'Compass';
const DESCRIPTION =
  'The company brain that turns market moves into roadmaps — and roadmaps into promotions.';
const SOCIAL_IMAGE = `${SITE_URL}social-preview.png`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  icons: { icon: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/favicon.png` },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    title: TITLE,
    description: DESCRIPTION,
    siteName: TITLE,
    images: [{ url: SOCIAL_IMAGE, width: 1280, height: 640, alt: 'Compass — the company brain' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [SOCIAL_IMAGE],
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
