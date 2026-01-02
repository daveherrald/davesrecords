'use client';

import { useState, useRef, useEffect } from 'react';
import AlbumCard from './AlbumCard';
import type { Album } from '@/types/discogs';

interface AlbumGridProps {
  albums: Album[];
  userSlug?: string;
}

export default function AlbumGrid({ albums, userSlug }: AlbumGridProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate items per page based on screen size
  useEffect(() => {
    const updateItemsPerPage = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setItemsPerPage(6); // 2 columns × 3 rows on mobile
      } else if (width < 768) {
        setItemsPerPage(9); // 3 columns × 3 rows on tablet
      } else if (width < 1024) {
        setItemsPerPage(12); // 4 columns × 3 rows on small desktop
      } else if (width < 1280) {
        setItemsPerPage(15); // 5 columns × 3 rows on desktop
      } else {
        setItemsPerPage(18); // 6 columns × 3 rows on large desktop
      }
    };

    updateItemsPerPage();
    window.addEventListener('resize', updateItemsPerPage);
    return () => window.removeEventListener('resize', updateItemsPerPage);
  }, []);

  const totalPages = Math.ceil(albums.length / itemsPerPage);
  const currentAlbums = albums.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  // Minimum swipe distance
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentPage < totalPages - 1) {
      // Swipe left - go to next page
      setCurrentPage(prev => prev + 1);
    } else if (isRightSwipe && currentPage > 0) {
      // Swipe right - go to previous page
      setCurrentPage(prev => prev - 1);
    }
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
    containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="space-y-4">
      <div
        ref={containerRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="relative"
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 transition-opacity duration-300">
          {currentAlbums.map((album) => (
            <AlbumCard key={album.instanceId} album={album} userSlug={userSlug} />
          ))}
        </div>

        {/* Navigation arrows for desktop */}
        {totalPages > 1 && (
          <>
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 0}
              className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 bg-neutral-800/90 hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-full p-3 shadow-lg transition-all"
              aria-label="Previous page"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages - 1}
              className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 bg-neutral-800/90 hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-full p-3 shadow-lg transition-all"
              aria-label="Next page"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Page indicators */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => goToPage(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentPage
                  ? 'w-8 bg-white'
                  : 'w-2 bg-neutral-600 hover:bg-neutral-500'
              }`}
              aria-label={`Go to page ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Page counter */}
      {totalPages > 1 && (
        <div className="text-center text-sm text-neutral-400">
          Page {currentPage + 1} of {totalPages} • {albums.length} records total
        </div>
      )}
    </div>
  );
}
