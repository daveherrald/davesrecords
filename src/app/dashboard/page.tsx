import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CopyButton } from '@/components/CopyButton';

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect('/auth/signin');
  }

  const collectionUrl = `${process.env.NEXTAUTH_URL}/c/${session.user.publicSlug}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 p-4">
      <div className="mx-auto max-w-4xl space-y-8 py-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-white">
            Welcome, {session.user.discogsUsername}
          </h1>
          <p className="text-lg text-neutral-300">
            Manage your vinyl collection and share it with visitors
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Your Collection URL</CardTitle>
              <CardDescription>
                Share this link with anyone to view your collection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-neutral-100 p-3">
                <code className="text-sm break-all">{collectionUrl}</code>
              </div>
              <div className="flex gap-2">
                <Link href={`/c/${session.user.publicSlug}`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    View Collection
                  </Button>
                </Link>
                <CopyButton
                  text={collectionUrl}
                  variant="outline"
                  className="flex-1"
                >
                  Copy Link
                </CopyButton>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>QR Code</CardTitle>
              <CardDescription>
                Generate a QR code for easy mobile access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/qr">
                <Button className="w-full">
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
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                    />
                  </svg>
                  Generate QR Code
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>
                Customize your collection display and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/settings">
                <Button variant="outline" className="w-full">
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
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Manage Settings
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>
                Connected to Discogs as {session.user.discogsUsername}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm text-neutral-600">
                <p>
                  <strong>Email:</strong> {session.user.email || 'Not provided'}
                </p>
                <p>
                  <strong>Public Slug:</strong> {session.user.publicSlug}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
