'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('artist');
  const [connections, setConnections] = useState<Array<{
    id: string;
    username: string;
    name: string;
    isPrimary: boolean;
  }>>([]);
  const [selectedConnectionIds, setSelectedConnectionIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchStack();
    fetchStackRecords();
    fetchAllStackInstances();
    fetchConnections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stackId]);

  // Refetch collection when selected connections change
  useEffect(() => {
    if (selectedConnectionIds.size > 0) {
      fetchCollection();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConnectionIds]);

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

  const fetchConnections = async () => {
    try {
      const response = await fetch('/api/auth/discogs/connections');
      if (response.ok) {
        const data = await response.json();
        setConnections(data.connections || []);
        // Select all connections by default
        const allIds = (data.connections || []).map((c: any) => c.id);
        setSelectedConnectionIds(new Set(allIds));
      }
    } catch (error) {
      console.error('Failed to fetch connections:', error);
    }
  };

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
      if (!userSlug || selectedConnectionIds.size === 0) return;

      // Fetch from all selected connections
      const connectionArray = Array.from(selectedConnectionIds);
      const promises = connectionArray.map((connectionId) =>
        fetch(`/api/collection/${userSlug}?page=${page}&connectionId=${connectionId}`)
          .then((res) => res.json())
          .catch((err) => {
            console.error(`Failed to fetch from connection ${connectionId}:`, err);
            return { albums: [] };
          })
      );

      const results = await Promise.all(promises);

      // Combine albums from all connections and deduplicate by instanceId
      const allAlbums: Album[] = [];
      const seenInstanceIds = new Set<number>();

      for (const data of results) {
        for (const album of data.albums || []) {
          if (!seenInstanceIds.has(album.instanceId)) {
            allAlbums.push(album);
            seenInstanceIds.add(album.instanceId);
          }
        }
      }

      if (append) {
        setAlbums((prev) => {
          const combined = [...prev, ...allAlbums];
          // Deduplicate again in case of overlap
          const uniqueMap = new Map(combined.map((a) => [a.instanceId, a]));
          return Array.from(uniqueMap.values());
        });
      } else {
        setAlbums(allAlbums);
      }

      setCurrentPage(page);
      // Simplified: assume has more if any connection has more pages
      const hasMorePages = results.some((data) => data.pagination && page < data.pagination.pages);
      setHasMore(hasMorePages);
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

  // Sort albums
  const sortedAlbums = [...filteredAlbums].sort((a, b) => {
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

  if (loading && albums.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 p-4">
        <div className="mx-auto max-w-6xl py-8">
          <div className="flex items-center justify-center gap-2 text-neutral-400 mb-6">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p>Loading your collection from Discogs...</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-square bg-neutral-800 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 p-4">
      <div className="mx-auto max-w-6xl space-y-4 py-6">
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

        {/* Connection Filter (if multiple connections) */}
        {connections.length > 1 && (
          <div className="bg-neutral-800/50 rounded-lg p-3">
            <p className="text-sm font-medium text-neutral-300 mb-2">Filter by Account:</p>
            <div className="flex flex-wrap gap-3">
              {connections.map((conn) => (
                <label key={conn.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedConnectionIds.has(conn.id)}
                    onChange={(e) => {
                      const newSet = new Set(selectedConnectionIds);
                      if (e.target.checked) {
                        newSet.add(conn.id);
                      } else {
                        newSet.delete(conn.id);
                      }
                      setSelectedConnectionIds(newSet);
                    }}
                    className="w-4 h-4 rounded border-neutral-600 text-neutral-900 focus:ring-neutral-500"
                  />
                  <span className="text-sm text-neutral-300">
                    {conn.name} {conn.isPrimary && '(Primary)'}
                  </span>
                </label>
              ))}
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              {selectedConnectionIds.size === connections.length
                ? 'Showing records from all accounts'
                : `Showing records from ${selectedConnectionIds.size} of ${connections.length} accounts`}
            </p>
          </div>
        )}

        {/* Search and Controls */}
        <div className="flex gap-2 items-center">
          <Input
            placeholder="Search by artist or album..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
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
          <div className="flex gap-1 border border-neutral-700 rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-9 px-3"
            >
              Grid
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-9 px-3"
            >
              List
            </Button>
          </div>
        </div>

        {/* Albums Grid or List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {sortedAlbums.map((album) => {
              const isAdding = adding.has(album.instanceId);

              return (
                <div
                  key={album.instanceId}
                  className="group cursor-pointer overflow-hidden rounded-lg transition-all hover:scale-105 hover:shadow-xl"
                >
                  <div className="aspect-square relative bg-neutral-800">
                    <Image
                      src={album.coverImage || album.thumbnail}
                      alt={`${album.artist} - ${album.title}`}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      className="object-cover"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <Button
                          size="sm"
                          onClick={() => handleAddToStack(album)}
                          disabled={isAdding}
                          className="w-full h-8 text-xs"
                        >
                          {isAdding ? 'Adding...' : 'Add'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-1">
            {sortedAlbums.map((album) => {
              const isAdding = adding.has(album.instanceId);

              return (
                <div
                  key={album.instanceId}
                  className="flex items-center gap-2 p-2 rounded-lg bg-neutral-800/50 hover:bg-neutral-800/70 transition-colors"
                >
                  <div className="w-12 h-12 relative flex-shrink-0 rounded overflow-hidden">
                    <Image
                      src={album.thumbnail || album.coverImage}
                      alt={`${album.artist} - ${album.title}`}
                      fill
                      sizes="48px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <p className="text-white text-sm font-medium truncate">
                        {album.artist}
                      </p>
                      <p className="text-neutral-400 text-sm truncate">
                        {album.title}
                      </p>
                      <p className="text-neutral-500 text-xs flex-shrink-0">
                        {album.year}
                      </p>
                    </div>
                    <p className="text-xs text-neutral-500 truncate">{album.format}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAddToStack(album)}
                    disabled={isAdding}
                    className="h-8 px-3 text-xs"
                  >
                    {isAdding ? 'Adding...' : 'Add to Stack'}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

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
