'use client';

import { useEffect } from 'react';
import SearchBar from './SearchBar';
import FilterPanel from './FilterPanel';
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
  onFiltersChange: (filters: any) => void;
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
        className={`fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[400px] bg-white shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 p-4">
          <h2 id="drawer-title" className="text-lg font-semibold text-neutral-900">
            Search & Filters
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
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
          <div className="text-sm text-neutral-600">
            Showing {totalResults} of {totalRecords} records
          </div>

          {/* Search */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-900">
              Search
            </label>
            <SearchBar value={searchQuery} onChange={onSearchChange} />
          </div>

          {/* Sort */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-neutral-900">
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
                    className="h-4 w-4 text-neutral-900 focus:ring-neutral-500"
                  />
                  <span className="text-sm text-neutral-700">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-900">
              Filters
            </label>
            <FilterPanel filters={filters} onChange={onFiltersChange} />
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-neutral-200 bg-white p-4 flex gap-2">
          <Button
            variant="outline"
            onClick={handleClearAll}
            className="flex-1"
          >
            Clear All
          </Button>
          <Button
            onClick={onClose}
            className="flex-1"
          >
            Done
          </Button>
        </div>
      </div>
    </>
  );
}
