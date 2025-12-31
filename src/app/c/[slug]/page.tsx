'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import AlbumGrid from '@/components/collection/AlbumGrid';
import SearchBar from '@/components/collection/SearchBar';
import FilterPanel from '@/components/collection/FilterPanel';
import SortSelect from '@/components/collection/SortSelect';
import { Skeleton } from '@/components/ui/skeleton';
import type { Album } from '@/types/discogs';

interface CollectionData {
  user: {
    displayName: string;
    bio: string | null;
  };
  albums: Album[];
  pagination: {
    page: number;
    pages: number;
    items: number;
  };
}

export default function CollectionPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [data, setData] = useState<CollectionData | null>(null);
  const [filteredAlbums, setFilteredAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('artist');
  const [filters, setFilters] = useState({
    yearFrom: '',
    yearTo: '',
    format: '',
    genre: '',
  });

  useEffect(() => {
    fetchCollection();
  }, [slug]);

  useEffect(() => {
    if (data) {
      applyFiltersAndSort();
    }
  }, [data, searchQuery, sortBy, filters]);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
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
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 p-4">
      <div className="mx-auto max-w-7xl space-y-6 py-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            {data?.user.displayName || 'Vinyl Collection'}
          </h1>
          {data?.user.bio && (
            <p className="text-lg text-neutral-300">{data.user.bio}</p>
          )}
          <p className="text-sm text-neutral-400">
            {data?.pagination.items} records in collection
          </p>
        </div>

        <div className="space-y-4">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <FilterPanel filters={filters} onChange={setFilters} />
            <SortSelect value={sortBy} onChange={setSortBy} />
          </div>
        </div>

        <AlbumGrid albums={filteredAlbums} />

        {filteredAlbums.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-lg text-neutral-400">
              No records found matching your criteria
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
