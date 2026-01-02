import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CopyButton } from '@/components/CopyButton';
import { Header } from '@/components/Header';

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect('/auth/signin');
  }

  const collectionUrl = `${process.env.NEXTAUTH_URL}/c/${session.user.publicSlug}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
      <Header />
      <div className="mx-auto max-w-4xl space-y-8 py-8 px-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-white">
            Welcome, {session.user.displayName || session.user.name}
          </h1>
          <p className="text-lg text-neutral-300">
            Manage your vinyl collection and share it with visitors
          </p>
        </div>

        {!session.user.hasDiscogsConnection && (
          <Card className="border-yellow-500/50 bg-yellow-500/10">
            <CardHeader>
              <CardTitle className="text-yellow-100">Connect Your Discogs Account</CardTitle>
              <CardDescription className="text-yellow-200/80">
                To display your vinyl collection, you need to connect your Discogs account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/settings">
                <Button className="w-full bg-yellow-600 hover:bg-yellow-700">
                  Connect Discogs Account
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

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
              <CardTitle>Stacks</CardTitle>
              <CardDescription>
                Create collections for different listening areas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/stacks">
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
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                  Manage Stacks
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Collection Stats</CardTitle>
              <CardDescription>
                See how many people are viewing your collection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/stats">
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
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  View Statistics
                </Button>
              </Link>
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
              <CardTitle>Profile Image</CardTitle>
              <CardDescription>
                Create a collage from your album collection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/profile-image">
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
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Create Collage
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
                {session.user.hasDiscogsConnection
                  ? `Connected to Discogs as ${session.user.discogsUsername}`
                  : 'Signed in with Google'}
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
                {session.user.hasDiscogsConnection && (
                  <p>
                    <strong>Discogs:</strong> {session.user.discogsUsername}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
