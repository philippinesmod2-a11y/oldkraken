import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      <div className="text-center max-w-lg">
        <div className="text-8xl mb-6">🐙</div>
        <h1 className="text-6xl font-black text-white mb-4">404</h1>
        <h2 className="text-2xl font-bold text-dark-200 mb-4">Page Not Found</h2>
        <p className="text-dark-400 mb-8 leading-relaxed">
          The page you are looking for does not exist or has been moved. Return to OldKraken — the official sister exchange of Kraken.com, co-founded July 2011.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="btn-primary !px-8 !py-3 inline-flex items-center justify-center gap-2">
            ← Back to Home
          </Link>
          <Link href="/dashboard" className="btn-secondary !px-8 !py-3 inline-flex items-center justify-center gap-2">
            Go to Dashboard
          </Link>
        </div>
        <p className="text-dark-600 text-xs mt-8">OldKraken Exchange Ltd. · Sister of Kraken.com · Founded July 2011</p>
      </div>
    </div>
  );
}
