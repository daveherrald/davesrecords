'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Filters {
  yearFrom: string;
  yearTo: string;
  format: string;
  genre: string;
}

interface FilterPanelProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

export default function FilterPanel({ filters, onChange }: FilterPanelProps) {
  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  const handleClear = () => {
    onChange({
      yearFrom: '',
      yearTo: '',
      format: '',
      genre: '',
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="relative">
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
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          Filter
          {activeFiltersCount > 0 && (
            <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Filter Collection</DialogTitle>
          <DialogDescription>
            Narrow down your search with these filters
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="yearFrom" className="text-sm font-medium">
                Year From
              </label>
              <Input
                id="yearFrom"
                type="number"
                placeholder="1950"
                value={filters.yearFrom}
                onChange={(e) =>
                  onChange({ ...filters, yearFrom: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="yearTo" className="text-sm font-medium">
                Year To
              </label>
              <Input
                id="yearTo"
                type="number"
                placeholder="2024"
                value={filters.yearTo}
                onChange={(e) =>
                  onChange({ ...filters, yearTo: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="format" className="text-sm font-medium">
              Format
            </label>
            <Input
              id="format"
              placeholder="LP, 12&quot;, CD, etc."
              value={filters.format}
              onChange={(e) =>
                onChange({ ...filters, format: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="genre" className="text-sm font-medium">
              Genre
            </label>
            <Input
              id="genre"
              placeholder="Rock, Jazz, Electronic, etc."
              value={filters.genre}
              onChange={(e) =>
                onChange({ ...filters, genre: e.target.value })
              }
            />
          </div>

          {activeFiltersCount > 0 && (
            <Button variant="outline" onClick={handleClear} className="w-full">
              Clear All Filters
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
