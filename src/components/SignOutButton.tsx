'use client';

import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export function SignOutButton() {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <Button
      onClick={handleSignOut}
      variant="outline"
      size="sm"
      className="text-sm border-neutral-600 hover:border-neutral-500 hover:bg-neutral-800"
    >
      Sign Out
    </Button>
  );
}
