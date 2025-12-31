'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQRCode } from 'next-qrcode';

export default function QRCodePage() {
  const router = useRouter();
  const { Canvas } = useQRCode();
  const [collectionUrl, setCollectionUrl] = useState('');
  const [publicSlug, setPublicSlug] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real implementation, fetch session data from an API
    // For now, we'll use a placeholder
    const baseUrl = window.location.origin;
    const slug = 'your-collection'; // This would come from session
    setCollectionUrl(`${baseUrl}/c/${slug}`);
    setPublicSlug(slug);
    setLoading(false);
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 p-4">
      <div className="mx-auto max-w-2xl space-y-8 py-8">
        <div className="space-y-2">
          <Link href="/dashboard">
            <Button variant="ghost" className="text-neutral-300 hover:text-white">
              ← Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-4xl font-bold tracking-tight text-white">
            Your Collection QR Code
          </h1>
          <p className="text-lg text-neutral-300">
            Download and print this QR code for easy mobile access
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>QR Code</CardTitle>
            <CardDescription>
              Scan with any smartphone camera to view your collection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center rounded-lg bg-white p-8">
              <Canvas
                text={collectionUrl}
                options={{
                  errorCorrectionLevel: 'H',
                  margin: 3,
                  scale: 4,
                  width: 300,
                }}
              />
            </div>

            <div className="space-y-2">
              <p className="text-center text-sm text-neutral-600">
                {collectionUrl}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                className="flex-1"
                onClick={() => {
                  const svg = document.querySelector('svg');
                  if (!svg) return;

                  const svgData = new XMLSerializer().serializeToString(svg);
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  const img = new Image();

                  img.onload = () => {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx?.drawImage(img, 0, 0);
                    const pngFile = canvas.toDataURL('image/png');

                    const downloadLink = document.createElement('a');
                    downloadLink.download = `${publicSlug}-qr-code.png`;
                    downloadLink.href = pngFile;
                    downloadLink.click();
                  };

                  img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
                }}
              >
                Download PNG
              </Button>

              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  const canvasEl = document.querySelector('canvas');
                  if (!canvasEl) return;

                  canvasEl.toBlob((blob) => {
                    if (!blob) return;
                    const url = URL.createObjectURL(blob);
                    const downloadLink = document.createElement('a');
                    downloadLink.download = `${publicSlug}-qr-code.png`;
                    downloadLink.href = url;
                    downloadLink.click();
                    URL.revokeObjectURL(url);
                  });
                }}
              >
                Download SVG
              </Button>

              <Button
                variant="outline"
                className="flex-1"
                onClick={() => window.print()}
              >
                Print
              </Button>
            </div>

            <div className="rounded-lg bg-neutral-100 p-4 text-sm text-neutral-700">
              <p className="font-semibold mb-2">Tips for printing:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Print on white paper for best scanning results</li>
                <li>Ensure the QR code is at least 2x2 inches (5x5 cm)</li>
                <li>Place it near your turntable or record collection</li>
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
