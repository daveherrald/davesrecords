'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { Album } from '@/types/discogs';

interface Stack {
  id: string;
  name: string;
  slug: string;
}

interface StackRecord {
  id: string;
  instanceId: string;
  releaseId: string;
}

interface StackInstance {
  stackId: string;
  stackName: string;
}

export default function AddRecordsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const stackId = params.stackId as string;

  const [stack, setStack] = useState<Stack | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [stackRecords, setStackRecords] = useState<StackRecord[]>([]);
  const [allStackInstances, setAllStackInstances] = useState<Record<string, StackInstance>>({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [adding, setAdding] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchStack();
    fetchStackRecords();
    fetchAllStackInstances();
    fetchCollection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stackId]);

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (loadingMore || !hasMore || loading) return;

      const scrollPosition = window.innerHeight + window.scrollY;
      const bottomPosition = document.documentElement.scrollHeight - 500;

      if (scrollPosition >= bottomPosition) {
        fetchCollection(currentPage + 1, true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingMore, hasMore, loading, currentPage]);

  const fetchStack = async () => {
    try {
      const response = await fetch(`/api/stack/${stackId}`);
      if (response.ok) {
        const data = await response.json();
        setStack(data.stack);
      } else {
        router.push('/dashboard/stacks');
      }
    } catch (error) {
      console.error('Failed to fetch stack:', error);
    }
  };

  const fetchStackRecords = async () => {
    try {
      const response = await fetch(`/api/stack/${stackId}/records`);
      if (response.ok) {
        const data = await response.json();
        setStackRecords(data.records);
      }
    } catch (error) {
      console.error('Failed to fetch stack records:', error);
    }
  };

  const fetchAllStackInstances = async () => {
    try {
      const response = await fetch('/api/stack/instances');
      if (response.ok) {
        const data = await response.json();
        setAllStackInstances(data.instances);
      }
    } catch (error) {
      console.error('Failed to fetch stack instances:', error);
    }
  };

  const fetchCollection = async (page: number = 1, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      // Get user's public slug to fetch their own collection
      const userSlug = session?.user?.publicSlug;
      if (!userSlug) return;

      const response = await fetch(`/api/collection/${userSlug}?page=${page}`);
      if (!response.ok) throw new Error('Failed to fetch collection');

      const data = await response.json();

      if (append) {
        setAlbums((prev) => [...prev, ...data.albums]);
      } else {
        setAlbums(data.albums);
      }

      setCurrentPage(page);
      setHasMore(page < data.pagination.pages);
    } catch (error) {
      console.error('Failed to fetch collection:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleAddToStack = async (album: Album) => {
    setAdding((prev) => new Set(prev).add(album.instanceId));

    try {
      const response = await fetch(`/api/stack/${stackId}/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          releaseId: album.id,
          instanceId: album.instanceId,
        }),
      });

      if (response.ok) {
        // Add to local stack records list
        const data = await response.json();
        setStackRecords((prev) => [...prev, data.record]);
        // Add to all stack instances map
        setAllStackInstances((prev) => ({
          ...prev,
          [album.instanceId.toString()]: {
            stackId: stackId,
            stackName: stack?.name || 'Stack',
          },
        }));
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add record to stack');
      }
    } catch (error) {
      alert('Failed to add record to stack');
    } finally {
      setAdding((prev) => {
        const next = new Set(prev);
        next.delete(album.instanceId);
        return next;
      });
    }
  };

  const isInStack = (instanceId: number) => {
    return stackRecords.some((r) => r.instanceId === instanceId.toString());
  };

  const getStackInfo = (instanceId: number): StackInstance | null => {
    return allStackInstances[instanceId.toString()] || null;
  };

  // Filter to only show albums NOT in any stack
  const availableAlbums = albums.filter((album) => {
    return !allStackInstances[album.instanceId.toString()];
  });

  const filteredAlbums = availableAlbums.filter((album) =>
    searchQuery
      ? album.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        album.artist.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  if (loading && albums.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 p-4">
        <div className="mx-auto max-w-6xl py-8">
          <p className="text-white">Loading collection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 p-4">
      <div className="mx-auto max-w-6xl space-y-6 py-8">
        {/* Header */}
        <div>
          <Link href={`/dashboard/stacks/${stackId}`}>
            <Button variant="ghost" className="text-neutral-300 hover:text-white mb-2">
              ← Back to {stack?.name}
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-white">Add Records to Stack</h1>
          <p className="text-neutral-300 mt-2">
            Showing {filteredAlbums.length} available records not in any stack
          </p>
          {albums.length > availableAlbums.length && (
            <p className="text-neutral-500 text-sm mt-1">
              ({albums.length - availableAlbums.length} records hidden - already in other stacks)
            </p>
          )}
        </div>

        {/* Search */}
        <div className="flex gap-4">
          <Input
            placeholder="Search by artist or album..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Albums Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredAlbums.map((album) => {
            const isAdding = adding.has(album.instanceId);

            return (
              <Card
                key={album.instanceId}
                className="group relative overflow-hidden transition-all"
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
                        <Button
                          size="sm"
                          onClick={() => handleAddToStack(album)}
                          disabled={isAdding}
                          className="w-full"
                        >
                          {isAdding ? 'Adding...' : 'Add to Stack'}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-white text-sm truncate">
                      {album.title}
                    </h3>
                    <p className="text-xs text-neutral-400 truncate">{album.artist}</p>
                    <p className="text-xs text-neutral-500">{album.year}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Loading More Indicator */}
        {loadingMore && (
          <div className="text-center py-4">
            <p className="text-neutral-400 text-sm">Loading more albums...</p>
          </div>
        )}

        {/* No Results */}
        {filteredAlbums.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-neutral-400">No albums found</p>
          </div>
        )}
      </div>
    </div>
  );
}
