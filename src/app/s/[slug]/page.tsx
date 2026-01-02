'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import type { Album } from '@/types/discogs';

interface Stack {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: string;
  isPublic: boolean;
  defaultSort: string;
  curators: Array<{
    user: {
      displayName: string | null;
    };
  }>;
}

interface StackRecord {
  id: string;
  releaseId: string;
  instanceId: string;
  notes: string | null;
}

export default function PublicStackPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [stack, setStack] = useState<Stack | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('');

  useEffect(() => {
    fetchStack();
  }, [slug]);

  useEffect(() => {
    if (stack?.defaultSort) {
      setSortBy(stack.defaultSort);
    }
  }, [stack]);

  useEffect(() => {
    if (albums.length > 0) {
      applySorting();
    }
  }, [sortBy]);

  const fetchStack = async () => {
    try {
      setLoading(true);

      // First, get the stack by slug
      const stackResponse = await fetch(`/api/stack/slug/${slug}`);
      if (!stackResponse.ok) {
        setError('Stack not found');
        setLoading(false);
        return;
      }

      const stackData = await stackResponse.json();
      setStack(stackData.stack);

      // Then get the records
      const recordsResponse = await fetch(`/api/stack/${stackData.stack.id}/records`);
      if (!recordsResponse.ok) {
        setError('Failed to load records');
        setLoading(false);
        return;
      }

      const recordsData = await recordsResponse.json();
      const records: StackRecord[] = recordsData.records;

      // Fetch album details for each record
      const albumPromises = records.map(async (record) => {
        try {
          const albumResponse = await fetch(`/api/release/${record.releaseId}`);
          if (albumResponse.ok) {
            const albumData = await albumResponse.json();
            return {
              ...albumData.release,
              stackNotes: record.notes,
            };
          }
          return null;
        } catch (err) {
          console.error(`Failed to fetch album ${record.releaseId}:`, err);
          return null;
        }
      });

      const fetchedAlbums = await Promise.all(albumPromises);
      const validAlbums = fetchedAlbums.filter((a) => a !== null) as Album[];
      setAlbums(validAlbums);
    } catch (err) {
      console.error('Failed to fetch stack:', err);
      setError('Failed to load stack');
    } finally {
      setLoading(false);
    }
  };

  const applySorting = () => {
    const sorted = [...albums].sort((a, b) => {
      switch (sortBy) {
        case 'artist':
          return a.artist.localeCompare(b.artist);
        case 'artist-desc':
          return b.artist.localeCompare(a.artist);
        case 'year':
          return b.year - a.year;
        case 'year-asc':
          return a.year - b.year;
        case 'title':
          return a.title.localeCompare(b.title);
        case 'added':
          return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
        default:
          return 0;
      }
    });
    setAlbums(sorted);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 p-4">
        <div className="mx-auto max-w-7xl py-8">
          <div className="space-y-4">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-6 w-96" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-8">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="aspect-square" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !stack) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 p-4">
        <div className="mx-auto max-w-7xl py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-neutral-400 mb-4">{error || 'Stack not found'}</p>
              <Link href="/" className="text-blue-400 hover:text-blue-300">
                Go to home
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!stack.isPublic) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 p-4">
        <div className="mx-auto max-w-7xl py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-neutral-400">This stack is private</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 p-4">
      <div className="mx-auto max-w-7xl space-y-6 py-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white">{stack.name}</h1>
          {stack.description && (
            <p className="text-neutral-300 text-lg">{stack.description}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-neutral-400">
            <span>{albums.length} records</span>
            <span>•</span>
            <span>
              Curated by{' '}
              {stack.curators.map((c) => c.user.displayName).filter(Boolean).join(', ') ||
                'Unknown'}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="artist">Artist (A-Z)</SelectItem>
                <SelectItem value="artist-desc">Artist (Z-A)</SelectItem>
                <SelectItem value="year">Year (Newest)</SelectItem>
                <SelectItem value="year-asc">Year (Oldest)</SelectItem>
                <SelectItem value="title">Title (A-Z)</SelectItem>
                <SelectItem value="added">Recently Added</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Albums Grid */}
        {albums.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-neutral-400">No records in this stack yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {albums.map((album) => (
              <Card
                key={album.instanceId}
                className="group relative overflow-hidden hover:border-neutral-600 transition-all"
              >
                <CardContent className="p-0">
                  <div className="aspect-square relative">
                    <Image
                      src={album.coverImage || album.thumbnail}
                      alt={`${album.artist} - ${album.title}`}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      className="object-cover"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <Link
                          href={`https://www.discogs.com/release/${album.id}`}
                          target="_blank"
                          className="text-xs text-blue-400 hover:text-blue-300"
                        >
                          View on Discogs →
                        </Link>
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-white text-sm truncate">
                      {album.title}
                    </h3>
                    <p className="text-xs text-neutral-400 truncate">{album.artist}</p>
                    <p className="text-xs text-neutral-500">
                      {album.year} • {album.format}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
