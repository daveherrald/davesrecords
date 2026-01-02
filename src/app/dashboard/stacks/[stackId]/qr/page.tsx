'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQRCode } from 'next-qrcode';

interface Stack {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export default function StackQRCodePage() {
  const params = useParams();
  const router = useRouter();
  const { Canvas } = useQRCode();
  const stackId = params.stackId as string;

  const [stack, setStack] = useState<Stack | null>(null);
  const [stackUrl, setStackUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStack = async () => {
      try {
        const response = await fetch(`/api/stack/${stackId}`);
        if (!response.ok) {
          router.push('/dashboard/stacks');
          return;
        }
        const data = await response.json();
        setStack(data.stack);

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
        setStackUrl(`${baseUrl}/s/${data.stack.slug}`);
      } catch (error) {
        console.error('Failed to fetch stack:', error);
        router.push('/dashboard/stacks');
      } finally {
        setLoading(false);
      }
    };

    fetchStack();
  }, [stackId, router]);

  if (loading || !stack) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 p-4">
        <div className="mx-auto max-w-2xl py-8">
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 p-4">
      <div className="mx-auto max-w-2xl space-y-8 py-8">
        <div className="space-y-2">
          <Link href={`/dashboard/stacks/${stackId}`}>
            <Button variant="ghost" className="text-neutral-300 hover:text-white">
              ← Back to {stack.name}
            </Button>
          </Link>
          <h1 className="text-4xl font-bold tracking-tight text-white">
            QR Code for {stack.name}
          </h1>
          <p className="text-lg text-neutral-300">
            Download and print this QR code for your listening area
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Stack QR Code</CardTitle>
            <CardDescription>
              Scan with any smartphone camera to view this stack
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center rounded-lg bg-white p-8 print-area">
              <div className="text-center">
                <Canvas
                  text={stackUrl}
                  options={{
                    errorCorrectionLevel: 'H',
                    margin: 3,
                    scale: 4,
                    width: 300,
                  }}
                />
                <p className="mt-4 text-sm text-neutral-700 font-medium">{stack.name}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-center text-sm text-neutral-400">
                {stackUrl}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                className="flex-1"
                onClick={() => {
                  const canvas = document.querySelector('canvas');
                  if (!canvas) return;

                  canvas.toBlob((blob) => {
                    if (!blob) return;
                    const url = URL.createObjectURL(blob);
                    const downloadLink = document.createElement('a');
                    downloadLink.download = `${stack.slug}-qr-code.png`;
                    downloadLink.href = url;
                    downloadLink.click();
                    URL.revokeObjectURL(url);
                  });
                }}
              >
                Download PNG
              </Button>

              <Button
                variant="outline"
                className="flex-1"
                onClick={() => window.print()}
              >
                Print
              </Button>
            </div>

            <div className="rounded-lg bg-neutral-800 p-4 text-sm text-neutral-300">
              <p className="font-semibold mb-2 text-white">Tips for using your QR code:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Print on white paper for best scanning results</li>
                <li>Ensure the QR code is at least 2x2 inches (5x5 cm)</li>
                <li>Place it near this listening area</li>
                <li>Visitors can scan to browse what&apos;s available</li>
                <li>Test scanning from different distances</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area,
          .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
          }
        }
      `}</style>
    </div>
  );
}
