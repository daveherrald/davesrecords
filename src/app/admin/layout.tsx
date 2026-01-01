import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { Header } from '@/components/Header';
import { AdminNav } from './components/AdminNav';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // Redirect if not authenticated
  if (!session) {
    redirect('/auth/signin');
  }

  // Redirect if not admin
  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  // Redirect if banned
  if (session.user.status !== 'ACTIVE') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
      <Header />
      <div className="flex">
        {/* Side navigation */}
        <AdminNav />

        {/* Main content */}
        <main className="flex-1 p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
