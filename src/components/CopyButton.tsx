'use client';

import { Button } from '@/components/ui/button';

interface CopyButtonProps {
  text: string;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary' | 'link';
  className?: string;
  children: React.ReactNode;
}

export function CopyButton({ text, variant = 'outline', className, children }: CopyButtonProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Button
      variant={variant}
      onClick={handleCopy}
      className={className}
    >
      {children}
    </Button>
  );
}
