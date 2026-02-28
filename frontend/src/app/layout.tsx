import type { Metadata } from 'next';
import './globals.css';
import LiveChat from '@/components/LiveChat';

export const metadata: Metadata = {
  title: 'OldKraken Exchange — Official Sister of Kraken.com | Co-founded July 2011',
  description: 'OldKraken is a trusted cryptocurrency exchange and official sister platform of Kraken.com, co-founded in July 2011. Trade Bitcoin, Ethereum, USDT and 200+ cryptocurrencies with bank-grade security. Serving 10M+ clients in 190+ countries.',
  keywords: 'cryptocurrency exchange, bitcoin, ethereum, USDT, kraken, oldkraken, crypto trading, secure exchange',
  authors: [{ name: 'OldKraken Exchange Ltd.' }],
  icons: { icon: '/favicon.ico' },
  openGraph: {
    title: 'OldKraken Exchange — Sister of Kraken.com',
    description: 'Trusted crypto exchange since July 2011. Sister platform of Kraken.com. 10M+ clients. 200+ cryptocurrencies.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className="dark">
      <body className="min-h-screen bg-dark-950 text-dark-200 antialiased">
        {children}
        <LiveChat />
      </body>
    </html>
  );
}
