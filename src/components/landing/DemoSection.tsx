import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DemoSection() {
  return (
    <section className="w-full max-w-4xl mx-auto">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-800 via-neutral-700 to-neutral-800 p-8 sm:p-12 text-center border border-neutral-600">
        <div className="relative z-10 space-y-6">
          <div className="space-y-2">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              See It In Action
            </h2>
            <p className="text-lg text-neutral-300 max-w-2xl mx-auto">
              Check out a live example of a shared vinyl collection
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/c/-davesrecords">
              <Button size="lg" className="text-lg px-8 py-6">
                <svg
                  className="mr-2 h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                View Demo Collection
              </Button>
            </Link>
          </div>

          <p className="text-sm text-neutral-400">
            See how your collection could look to visitors
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/5 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-32 w-32 rounded-full bg-white/5 blur-2xl"></div>
      </div>
    </section>
  );
}
