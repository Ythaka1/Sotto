import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

/*
 * Type: General Sans (Fontshare), one family for the entire product.
 *
 * General Sans is not on Google Fonts and is not on npm under any Fontsource
 * package. To use the real thing, drop the woff2 files into public/fonts and
 * replace the block below with next/font/local. That is a one line swap and
 * nothing else in the product changes:
 *
 *   const generalSans = localFont({
 *     src: [
 *       { path: '../public/fonts/GeneralSans-Regular.woff2',  weight: '400' },
 *       { path: '../public/fonts/GeneralSans-Medium.woff2',   weight: '500' },
 *       { path: '../public/fonts/GeneralSans-Semibold.woff2', weight: '600' },
 *     ],
 *     variable: '--font-substitute',
 *     display: 'swap',
 *   });
 *
 * Until those files land this renders in Plus Jakarta Sans, which is the named
 * substitute: same geometric humanist skeleton, low contrast, open apertures,
 * slightly narrower. It is not the same typeface and is labelled as a
 * substitute wherever it shows. See docs/spec.md section 3.
 */
const substitute = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-substitute',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Sotto',
  description: 'One quiet question before you go.',
};

export const viewport: Viewport = {
  themeColor: '#F1F0EE',
  width: 'device-width',
  initialScale: 1,
  // The guest is holding a phone in one hand and a bag in the other. Nothing in
  // this flow is improved by pinch zoom, but capping it would fight anyone who
  // needs it, so maximumScale stays open.
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={substitute.variable}>
      <body>{children}</body>
    </html>
  );
}
