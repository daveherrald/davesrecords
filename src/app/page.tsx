import Link from 'next/link';
import { Button } from '@/components/ui/button';
import HowItWorks from '@/components/landing/HowItWorks';
import ScreenshotGallery from '@/components/landing/ScreenshotGallery';
import FAQ from '@/components/landing/FAQ';
import Footer from '@/components/landing/Footer';
import { Header } from '@/components/Header';
import { getSession } from '@/lib/auth';

export default async function Home() {
  const session = await getSession();

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
      <Header />
      <main className="flex-1 flex flex-col items-center px-4 py-16 space-y-32">
        {/* Hero Section */}
        <section className="max-w-4xl text-center space-y-8 pt-8">
          <div className="space-y-6">
            <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl md:text-7xl">
              Your records.
              <br />
              <span className="text-neutral-400">Your Stack.</span>
            </h1>
            <p className="mx-auto max-w-xl text-lg text-neutral-300 sm:text-xl">
              A Stack is your vinyl collection, beautifully displayed and easy to share.
              Sync with Discogs, generate a QR code, let people browse.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row justify-center pt-4">
            <Link href="/c/_davesrecords">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto text-lg px-8 py-6 border-neutral-600 hover:bg-neutral-800"
              >
                View a Stack
              </Button>
            </Link>
            {session ? (
              <Link href="/dashboard">
                <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/auth/signin">
                <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6">
                  Create Your Stack
                </Button>
              </Link>
            )}
          </div>
        </section>

        {/* Screenshot Gallery */}
        <ScreenshotGallery />

        {/* How It Works Section */}
        <HowItWorks />

        {/* FAQ Section */}
        <FAQ />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
