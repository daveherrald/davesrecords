import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">
            Dave&apos;s Records
          </CardTitle>
          <CardDescription className="text-base">
            Connect your Discogs account to share your vinyl collection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground text-center">
              Sign in with your Discogs account to get started. We&apos;ll access your
              collection to create a beautiful, shareable view for your visitors.
            </p>
          </div>

          <Link href="/api/auth/discogs" className="block">
            <Button className="w-full" size="lg">
              <svg
                className="mr-2 h-5 w-5"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="12" cy="12" r="10" />
              </svg>
              Connect with Discogs
            </Button>
          </Link>

          <div className="space-y-2 pt-4">
            <p className="text-xs text-muted-foreground text-center">
              By connecting, you agree to share your Discogs collection data.
              Your credentials are encrypted and stored securely.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
