'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import AlbumGrid from '@/components/collection/AlbumGrid';
import ControlsFAB from '@/components/collection/ControlsFAB';
import ControlsDrawer from '@/components/collection/ControlsDrawer';
import { Skeleton } from '@/components/ui/skeleton';
import type { Album } from '@/types/discogs';

interface CollectionData {
  user: {
    id: string;
    displayName: string;
    bio: string | null;
  };
  albums: Album[];
  pagination: {
    page: number;
    pages: number;
    items: number;
  };
  isOwnCollection?: boolean;
  excludedIds?: string[];
  albumCount?: {
    total: number;
    public: number;
    display: 'PUBLIC_ONLY' | 'TOTAL_AND_PUBLIC';
  };
}

export default function CollectionPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [data, setData] = useState<CollectionData | null>(null);
  const [filteredAlbums, setFilteredAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [excludedSet, setExcludedSet] = useState<Set<string>>(new Set());

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('artist');
  const [filters, setFilters] = useState({
    yearFrom: '',
    yearTo: '',
    format: '',
    genre: '',
  });
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    fetchCollection();
  }, [slug]);

  useEffect(() => {
    if (data) {
      applyFiltersAndSort();
    }
  }, [data, searchQuery, sortBy, filters]);

  // Track collection view
  useEffect(() => {
    if (data?.user?.id) {
      fetch('/api/analytics/track-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: data.user.id }),
      }).catch((err) => {
        // Silently fail - tracking is non-critical
        console.error('Failed to track view:', err);
      });
    }
  }, [data?.user?.id]);

  const fetchCollection = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/collection/${slug}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load collection');
      }

      const collectionData = await response.json();
      setData(collectionData);
      setFilteredAlbums(collectionData.albums);

      // Set excluded albums if viewing own collection
      if (collectionData.excludedIds) {
        setExcludedSet(new Set(collectionData.excludedIds));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Calculate active filters count for badge
  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchQuery) count++;
    if (filters.yearFrom) count++;
    if (filters.yearTo) count++;
    if (filters.format) count++;
    if (filters.genre) count++;
    if (sortBy !== 'artist') count++; // Default is 'artist'
    return count;
  };

  const toggleExclusion = async (albumId: number) => {
    const releaseIdStr = albumId.toString();
    const isCurrentlyExcluded = excludedSet.has(releaseIdStr);

    try {
      const response = await fetch('/api/user/excluded-albums', {
        method: isCurrentlyExcluded ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ releaseId: albumId }),
      });

      if (!response.ok) {
        throw new Error('Failed to update exclusion');
      }

      // Update local state
      const newSet = new Set(excludedSet);
      if (isCurrentlyExcluded) {
        newSet.delete(releaseIdStr);
      } else {
        newSet.add(releaseIdStr);
      }
      setExcludedSet(newSet);
    } catch (err) {
      console.error('Failed to toggle exclusion:', err);
      // Could show a toast notification here
    }
  };

  const applyFiltersAndSort = () => {
    if (!data) return;

    let filtered = [...data.albums];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (album) =>
          album.title.toLowerCase().includes(query) ||
          album.artist.toLowerCase().includes(query) ||
          album.label.toLowerCase().includes(query)
      );
    }

    // Apply filters
    if (filters.yearFrom) {
      filtered = filtered.filter((album) => album.year >= parseInt(filters.yearFrom));
    }
    if (filters.yearTo) {
      filtered = filtered.filter((album) => album.year <= parseInt(filters.yearTo));
    }
    if (filters.format) {
      filtered = filtered.filter((album) =>
        album.format.toLowerCase().includes(filters.format.toLowerCase())
      );
    }
    if (filters.genre) {
      filtered = filtered.filter((album) =>
        album.genres.some((g) => g.toLowerCase().includes(filters.genre.toLowerCase()))
      );
    }

    // Apply sort
    filtered.sort((a, b) => {
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

    setFilteredAlbums(filtered);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 p-4">
        <div className="mx-auto max-w-7xl space-y-8 py-8">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-8 w-96" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 p-4">
        <div className="mx-auto max-w-7xl py-8 text-center">
          <h1 className="text-2xl font-bold text-white">Error</h1>
          <p className="mt-2 text-neutral-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 p-3 sm:p-4">
      <div className="mx-auto max-w-7xl">
        {/* Minimal Header */}
        <div className="py-3 sm:py-4">
          <h1 className="text-base sm:text-lg font-medium text-white">
            {data?.user.displayName || 'Vinyl Collection'} • {
              data?.albumCount ? (
                data.albumCount.display === 'TOTAL_AND_PUBLIC'
                  ? `${data.albumCount.total} albums, ${data.albumCount.public} public`
                  : `${data.albumCount.public} records`
              ) : `${data?.pagination.items || 0} records`
            }
          </h1>
        </div>

        {/* Album Grid - starts immediately */}
        <AlbumGrid
          albums={filteredAlbums}
          userSlug={slug}
          isOwnCollection={data?.isOwnCollection}
          excludedIds={excludedSet}
          onToggleExclusion={toggleExclusion}
        />

        {/* Empty State */}
        {filteredAlbums.length === 0 && !loading && (
          <div className="py-12 text-center">
            <p className="text-lg text-neutral-400">
              No records found matching your criteria
            </p>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <ControlsFAB
        onClick={() => setDrawerOpen(true)}
        activeFiltersCount={getActiveFiltersCount()}
      />

      {/* Controls Drawer */}
      <ControlsDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
        filters={filters}
        onFiltersChange={setFilters}
        totalResults={filteredAlbums.length}
        totalRecords={data?.pagination.items || 0}
      />
    </div>
  );
}
