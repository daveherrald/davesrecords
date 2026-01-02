'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const GRID_SIZES: Array<{ value: number | 'all'; label: string; count: number | null }> = [
  { value: 'all', label: 'All Albums', count: null },
  { value: 1, label: '1x1', count: 1 },
  { value: 2, label: '2x2', count: 4 },
  { value: 3, label: '3x3', count: 9 },
  { value: 4, label: '4x4', count: 16 },
  { value: 5, label: '5x5', count: 25 },
];

export default function ProfileImagePage() {
  const router = useRouter();
  const [gridSize, setGridSize] = useState<number | 'all'>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    try {
      console.log('Starting generation with grid size:', gridSize);
      setIsGenerating(true);
      setError(null);
      setImageUrl(null);

      const response = await fetch('/api/user/profile-image/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gridSize }),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate image');
      }

      // Convert blob to URL for preview
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      console.log('Image generated successfully');
      setImageUrl(url);
    } catch (err) {
      console.error('Generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!imageUrl) return;

    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = 'my-vinyl-collection.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
      <header className="w-full border-b border-neutral-700/50 bg-neutral-900/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white hover:text-neutral-300 transition-colors">
            Dave&apos;s Records
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-neutral-300 hover:text-white transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-4xl space-y-8 py-8 px-4">
        <div className="space-y-2">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              className="text-neutral-300 hover:text-white"
            >
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-4xl font-bold tracking-tight text-white">
            Profile Image Generator
          </h1>
          <p className="text-lg text-neutral-300">
            Create a collage from your album collection
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Generate Collage</CardTitle>
            <CardDescription>
              Select a grid size and generate a collage from random albums in your collection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-medium text-neutral-200">
                Grid Size
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {GRID_SIZES.map((size) => (
                  <Button
                    key={size.value}
                    type="button"
                    variant={gridSize === size.value ? 'default' : 'outline'}
                    onClick={() => setGridSize(size.value)}
                    className="h-20 flex flex-col items-center justify-center gap-1"
                  >
                    <span className="text-lg font-bold">{size.label}</span>
                    {size.count !== null && (
                      <span className="text-xs opacity-70">{size.count} albums</span>
                    )}
                  </Button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <svg
                    className="mr-2 h-5 w-5 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Generating...
                </>
              ) : (
                <>
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
                  Generate Collage
                </>
              )}
            </Button>

            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/50 p-4">
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {imageUrl && (
          <Card>
            <CardHeader>
              <CardTitle>Your Collage</CardTitle>
              <CardDescription>
                Preview and download your vinyl collection collage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg overflow-hidden bg-neutral-200">
                <img
                  src={imageUrl}
                  alt="Vinyl collection collage"
                  className="w-full h-auto"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleDownload}
                  className="flex-1"
                  size="lg"
                >
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
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Download Image
                </Button>
                <Button
                  onClick={handleGenerate}
                  variant="outline"
                  className="flex-1"
                  size="lg"
                >
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
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Generate New
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
