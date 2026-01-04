import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full border-t border-neutral-800 mt-24 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-center sm:text-left">
            <h3 className="text-lg font-bold text-white">Dave&apos;s Records</h3>
            <p className="text-sm text-neutral-400">
              Share your vinyl collection beautifully
            </p>
          </div>

          <div className="flex gap-6 text-sm">
            <Link
              href="/auth/signin"
              className="text-neutral-400 hover:text-white transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-neutral-800 text-center">
          <p className="text-xs text-neutral-500">
            © {new Date().getFullYear()} Dave&apos;s Records. Powered by Discogs.
          </p>
        </div>
      </div>
    </footer>
  );
}
