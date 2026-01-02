import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { SignOutButton } from '@/components/SignOutButton';

export async function Header() {
  const session = await getSession();

  return (
    <header className="w-full border-b border-neutral-700/50 bg-neutral-900/50 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-white hover:text-neutral-300 transition-colors">
          Dave's Records
        </Link>

        <nav className="flex items-center gap-4">
          {session ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm text-neutral-300 hover:text-white transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/stacks"
                className="text-sm text-neutral-300 hover:text-white transition-colors"
              >
                Stacks
              </Link>
              <Link
                href={`/c/${session.user.publicSlug}`}
                className="text-sm text-neutral-300 hover:text-white transition-colors"
              >
                My Collection
              </Link>
              <div className="flex items-center gap-3 border-l border-neutral-700 pl-4">
                <span className="text-sm text-neutral-400">
                  {session.user.name || session.user.email}
                </span>
                <SignOutButton />
              </div>
            </>
          ) : (
            <Link
              href="/auth/signin"
              className="text-sm text-neutral-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
