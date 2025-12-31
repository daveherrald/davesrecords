'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SortSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SortSelect({ value, onChange }: SortSelectProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-neutral-300">Sort by:</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue />
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
  );
}
