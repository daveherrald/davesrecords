import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const errorMessages: Record<string, string> = {
    OAuthError: 'Failed to connect with Discogs. Please try again.',
    CallbackError: 'An error occurred during authentication. Please try again.',
    Default: 'An unexpected error occurred. Please try again.',
  };

  const errorMessage = errorMessages[searchParams.error || 'Default'] || errorMessages.Default;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight text-destructive">
            Authentication Error
          </CardTitle>
          <CardDescription className="text-base">
            {errorMessage}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2">
            <Link href="/auth/signin" className="block">
              <Button className="w-full" variant="default">
                Try Again
              </Button>
            </Link>
            <Link href="/" className="block">
              <Button className="w-full" variant="outline">
                Go Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
