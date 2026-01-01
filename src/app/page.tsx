import Link from 'next/link';
import { Button } from '@/components/ui/button';
import HowItWorks from '@/components/landing/HowItWorks';
import DemoSection from '@/components/landing/DemoSection';
import FAQ from '@/components/landing/FAQ';
import Footer from '@/components/landing/Footer';
import { getSession } from '@/lib/auth';

export default async function Home() {
  const session = await getSession();

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
      <main className="flex-1 flex flex-col items-center px-4 py-16 space-y-24">
        {/* Hero Section */}
        <section className="max-w-4xl text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl md:text-7xl">
              Share Your Vinyl Collection
            </h1>
            <p className="mx-auto max-w-2xl text-xl text-neutral-300 sm:text-2xl">
              Create a beautiful, mobile-friendly view of your Discogs collection.
              Let visitors browse your records with a simple QR code.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row justify-center">
            {session ? (
              <Link href="/dashboard">
                <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/auth/signin">
                <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6">
                  Get Started
                </Button>
              </Link>
            )}
          </div>
        </section>

        {/* Demo Section */}
        <DemoSection />

        {/* How It Works Section */}
        <HowItWorks />

        {/* Features Section */}
        <section className="w-full max-w-6xl">
          <div className="grid max-w-3xl gap-8 mx-auto sm:grid-cols-3">
            <div className="space-y-2 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-800 mx-auto">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">Easy Setup</h3>
              <p className="text-sm text-neutral-400">
                Connect your Discogs account and generate a QR code in minutes
              </p>
            </div>

            <div className="space-y-2 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-800 mx-auto">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">Mobile First</h3>
              <p className="text-sm text-neutral-400">
                Beautiful, responsive design optimized for phones and tablets
              </p>
            </div>

            <div className="space-y-2 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-800 mx-auto">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">Album Art First</h3>
              <p className="text-sm text-neutral-400">
                Showcase your collection with stunning album artwork
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <FAQ />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
