'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import AlbumGrid from '@/components/collection/AlbumGrid';
import ControlsFAB from '@/components/collection/ControlsFAB';
import ControlsDrawer from '@/components/collection/ControlsDrawer';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
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
  const [allAlbums, setAllAlbums] = useState<Album[]>([]);
  const [filteredAlbums, setFilteredAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [filters, setFilters] = useState({
    yearFrom: '',
    yearTo: '',
    format: '',
    genre: '',
  });
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    fetchStack();
  }, [slug]);

  useEffect(() => {
    if (stack?.defaultSort && !sortBy) {
      setSortBy(stack.defaultSort);
    }
  }, [stack]);

  useEffect(() => {
    if (allAlbums.length > 0) {
      applyFiltersAndSort();
    }
  }, [allAlbums, searchQuery, sortBy, filters]);

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
      setAllAlbums(validAlbums);
    } catch (err) {
      console.error('Failed to fetch stack:', err);
      setError('Failed to load stack');
    } finally {
      setLoading(false);
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchQuery) count++;
    if (filters.yearFrom) count++;
    if (filters.yearTo) count++;
    if (filters.format) count++;
    if (filters.genre) count++;
    if (sortBy && sortBy !== stack?.defaultSort) count++;
    return count;
  };

  const applyFiltersAndSort = () => {
    if (allAlbums.length === 0) return;

    let filtered = [...allAlbums];

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

  if (error || !stack) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 p-4">
        <div className="mx-auto max-w-7xl py-8 text-center">
          <h1 className="text-2xl font-bold text-white">Error</h1>
          <p className="mt-2 text-neutral-300">{error || 'Stack not found'}</p>
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
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 p-3 sm:p-4">
      <div className="mx-auto max-w-7xl">
        {/* Minimal Header */}
        <div className="py-3 sm:py-4">
          <h1 className="text-base sm:text-lg font-medium text-white">
            {stack.name} • {filteredAlbums.length} of {allAlbums.length} records
          </h1>
          {stack.description && (
            <p className="text-sm text-neutral-400 mt-1">{stack.description}</p>
          )}
          <p className="text-xs text-neutral-500 mt-1">
            Curated by{' '}
            {stack.curators.map((c) => c.user.displayName).filter(Boolean).join(', ') ||
              'Unknown'}
          </p>
        </div>

        {/* Album Grid */}
        <AlbumGrid albums={filteredAlbums} />

        {/* Empty State */}
        {filteredAlbums.length === 0 && allAlbums.length > 0 && (
          <div className="py-12 text-center">
            <p className="text-lg text-neutral-400">
              No records found matching your criteria
            </p>
          </div>
        )}

        {filteredAlbums.length === 0 && allAlbums.length === 0 && !loading && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-neutral-400">No records in this stack yet</p>
            </CardContent>
          </Card>
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
        totalRecords={allAlbums.length}
      />
    </div>
  );
}
