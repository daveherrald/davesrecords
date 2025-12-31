'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

interface AlbumDetailProps {
  albumId: number;
  onClose: () => void;
}

interface AlbumDetailData {
  id: number;
  title: string;
  artist: string;
  year: number;
  coverImage: string;
  format: string;
  label: string;
  genres: string[];
  styles: string[];
  tracklist: Array<{
    position: string;
    title: string;
    duration: string;
  }>;
  catalogNumber: string;
  country?: string;
  notes?: string;
  discogsUrl: string;
}

export default function AlbumDetail({ albumId, onClose }: AlbumDetailProps) {
  const [album, setAlbum] = useState<AlbumDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For now, we'll just show a placeholder since the detail endpoint needs user context
    // In a real implementation, you'd fetch from an API endpoint
    setLoading(false);
  }, [albumId]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <div className="space-y-6">
            <DialogHeader>
              <DialogTitle className="text-2xl">Album Details</DialogTitle>
            </DialogHeader>

            <div className="rounded-lg bg-neutral-100 p-4 text-center">
              <p className="text-sm text-neutral-600">
                Detailed album information will be displayed here.
              </p>
              <p className="text-xs text-neutral-500 mt-2">
                This feature requires connecting to the Discogs API with user authentication.
              </p>
            </div>

            <div className="text-sm text-neutral-600">
              <p>Album ID: {albumId}</p>
              <p className="mt-2">
                In the full implementation, this modal will show:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>High-resolution album artwork</li>
                <li>Complete tracklist with durations</li>
                <li>Artist information and credits</li>
                <li>Label and catalog number</li>
                <li>Release date and country</li>
                <li>Genres and styles</li>
                <li>User notes (if any)</li>
                <li>Link to Discogs page</li>
              </ul>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
