'use client';

import { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ControlsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  filters: {
    yearFrom: string;
    yearTo: string;
    format: string;
    genre: string;
  };
  onFiltersChange: (filters: ControlsDrawerProps['filters']) => void;
  totalResults: number;
  totalRecords: number;
}

export default function ControlsDrawer({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  filters,
  onFiltersChange,
  totalResults,
  totalRecords,
}: ControlsDrawerProps) {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClearAll = () => {
    onSearchChange('');
    onSortChange('artist');
    onFiltersChange({
      yearFrom: '',
      yearTo: '',
      format: '',
      genre: '',
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className={`fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[400px] bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-700 p-4">
          <h2 id="drawer-title" className="text-lg font-semibold text-white">
            Search & Filters
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(100vh-140px)] p-4 space-y-6">
          {/* Results Count */}
          {totalResults < totalRecords ? (
            <div className="text-sm text-neutral-300">
              <span className="font-semibold text-white">{totalResults}</span> of {totalRecords} records match
            </div>
          ) : (
            <div className="text-sm text-neutral-300">
              {totalRecords} records total
            </div>
          )}

          {/* Search */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">
              Search
            </label>
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <Input
                type="text"
                placeholder="Search by artist, album, or label..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-neutral-600"
              />
            </div>
          </div>

          {/* Sort */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-white">
              Sort By
            </label>
            <div className="space-y-2">
              {[
                { value: 'artist', label: 'Artist A-Z' },
                { value: 'artist-desc', label: 'Artist Z-A' },
                { value: 'year', label: 'Year (newest first)' },
                { value: 'year-asc', label: 'Year (oldest first)' },
                { value: 'title', label: 'Title A-Z' },
                { value: 'added', label: 'Recently Added' },
              ].map((option) => (
                <label
                  key={option.value}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="sort"
                    value={option.value}
                    checked={sortBy === option.value}
                    onChange={(e) => onSortChange(e.target.value)}
                    className="h-4 w-4 text-white focus:ring-neutral-500"
                  />
                  <span className="text-sm text-neutral-300">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="space-y-4">
            <label className="text-sm font-medium text-white">
              Filters
            </label>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label htmlFor="yearFrom" className="text-xs font-medium text-neutral-400">
                  Year From
                </label>
                <Input
                  id="yearFrom"
                  type="number"
                  placeholder="1950"
                  value={filters.yearFrom}
                  onChange={(e) => onFiltersChange({ ...filters, yearFrom: e.target.value })}
                  className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-neutral-600"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="yearTo" className="text-xs font-medium text-neutral-400">
                  Year To
                </label>
                <Input
                  id="yearTo"
                  type="number"
                  placeholder="2024"
                  value={filters.yearTo}
                  onChange={(e) => onFiltersChange({ ...filters, yearTo: e.target.value })}
                  className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-neutral-600"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="format" className="text-xs font-medium text-neutral-400">
                Format
              </label>
              <Input
                id="format"
                placeholder="LP, 12&quot;, CD, etc."
                value={filters.format}
                onChange={(e) => onFiltersChange({ ...filters, format: e.target.value })}
                className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-neutral-600"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="genre" className="text-xs font-medium text-neutral-400">
                Genre
              </label>
              <Input
                id="genre"
                placeholder="Rock, Jazz, Electronic, etc."
                value={filters.genre}
                onChange={(e) => onFiltersChange({ ...filters, genre: e.target.value })}
                className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-neutral-600"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-neutral-700 bg-neutral-900 p-4 flex gap-2">
          <Button
            variant="outline"
            onClick={handleClearAll}
            className="flex-1 border-neutral-600 text-neutral-300 hover:bg-neutral-800 hover:text-white"
          >
            Clear All
          </Button>
          <Button
            onClick={onClose}
            className="flex-1 bg-white text-neutral-900 hover:bg-neutral-200"
          >
            Done
          </Button>
        </div>
      </div>
    </>
  );
}
