'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

interface AlbumDetailProps {
  albumId: number;
  userSlug?: string;
  onClose: () => void;
}

interface AlbumDetailData {
  id: number;
  title: string;
  artist: string;
  year: number;
  coverImage: string;
  format: string;
  label: string;
  genres: string[];
  styles: string[];
  tracklist: Array<{
    position: string;
    title: string;
    duration: string;
  }>;
  images: Array<{
    uri: string;
    uri150: string;
    type: string;
    width: number;
    height: number;
  }>;
  catalogNumber: string;
  country?: string;
  notes?: string;
  discogsUrl: string;
}

export default function AlbumDetail({ albumId, userSlug, onClose }: AlbumDetailProps) {
  const [album, setAlbum] = useState<AlbumDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageError, setImageError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    const fetchAlbumDetails = async () => {
      try {
        setLoading(true);
        setError('');

        const url = userSlug
          ? `/api/release/${albumId}?slug=${userSlug}`
          : `/api/release/${albumId}`;

        const response = await fetch(url);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to load album details');
        }

        const data = await response.json();
        setAlbum(data);
      } catch (err) {
        console.error('Error fetching album details:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchAlbumDetails();
  }, [albumId, userSlug]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!isLightboxOpen || !album) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setCurrentImageIndex((prev) =>
          prev === 0 ? album.images.length - 1 : prev - 1
        );
      } else if (e.key === 'ArrowRight') {
        setCurrentImageIndex((prev) =>
          prev === album.images.length - 1 ? 0 : prev + 1
        );
      } else if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, album]);

  // Minimum swipe distance (in px) to trigger navigation
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd || !album) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      // Swipe left - go to next image
      setCurrentImageIndex((prev) =>
        prev === album.images.length - 1 ? 0 : prev + 1
      );
    } else if (isRightSwipe) {
      // Swipe right - go to previous image
      setCurrentImageIndex((prev) =>
        prev === 0 ? album.images.length - 1 : prev - 1
      );
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 border-neutral-700">
        {loading ? (
          <div className="space-y-4 p-4">
            <Skeleton className="h-8 w-3/4 bg-neutral-700" />
            <Skeleton className="h-64 w-full bg-neutral-700" />
            <Skeleton className="h-32 w-full bg-neutral-700" />
          </div>
        ) : error ? (
          <div className="p-4">
            <DialogHeader>
              <DialogTitle className="text-2xl text-red-400">Error</DialogTitle>
            </DialogHeader>
            <p className="mt-4 text-neutral-300">{error}</p>
          </div>
        ) : album ? (
          <div className="space-y-6 p-6">
            {/* Header */}
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white">
                {album.artist} - {album.title}
              </DialogTitle>
              <p className="text-sm text-neutral-300">
                {album.year} • {album.label} • {album.catalogNumber}
              </p>
            </DialogHeader>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left column - Album art */}
              <div className="space-y-4">
                <div
                  className="aspect-square relative bg-neutral-200 rounded-lg overflow-hidden shadow-lg group"
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                >
                  {!imageError ? (
                    <>
                      <Image
                        src={album.images[currentImageIndex]?.uri || album.coverImage}
                        alt={`${album.artist} - ${album.title}`}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover cursor-zoom-in"
                        onError={() => setImageError(true)}
                        onClick={() => setIsLightboxOpen(true)}
                        key={currentImageIndex}
                      />

                      {/* Navigation buttons - only show if multiple images */}
                      {album.images.length > 1 && (
                        <>
                          <button
                            onClick={() => setCurrentImageIndex((prev) =>
                              prev === 0 ? album.images.length - 1 : prev - 1
                            )}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                            aria-label="Previous image"
                          >
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>

                          <button
                            onClick={() => setCurrentImageIndex((prev) =>
                              prev === album.images.length - 1 ? 0 : prev + 1
                            )}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                            aria-label="Next image"
                          >
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>

                          {/* Image counter */}
                          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                            {currentImageIndex + 1} / {album.images.length}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-neutral-300">
                      <svg
                        className="h-24 w-24 text-neutral-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Image indicator dots */}
                {album.images.length > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    {album.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`h-2 rounded-full transition-all ${
                          index === currentImageIndex
                            ? 'w-8 bg-white'
                            : 'w-2 bg-neutral-500 hover:bg-neutral-400'
                        }`}
                        aria-label={`Go to image ${index + 1}`}
                      />
                    ))}
                  </div>
                )}

                {/* Quick info */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-neutral-400">Format</span>
                    <span className="text-white">{album.format}</span>
                  </div>
                  {album.country && (
                    <div className="flex justify-between">
                      <span className="font-medium text-neutral-400">Country</span>
                      <span className="text-white">{album.country}</span>
                    </div>
                  )}
                  {album.genres.length > 0 && (
                    <div className="flex justify-between">
                      <span className="font-medium text-neutral-400">Genre</span>
                      <span className="text-white text-right">{album.genres.join(', ')}</span>
                    </div>
                  )}
                  {album.styles.length > 0 && (
                    <div className="flex justify-between">
                      <span className="font-medium text-neutral-400">Style</span>
                      <span className="text-white text-right">{album.styles.join(', ')}</span>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {album.notes && (
                  <div className="bg-neutral-800/50 p-4 rounded-lg border border-neutral-700">
                    <h3 className="text-sm font-semibold text-white mb-2">Notes</h3>
                    <p className="text-sm text-neutral-300 whitespace-pre-wrap">{album.notes}</p>
                  </div>
                )}

                {/* Discogs link */}
                <a
                  href={album.discogsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  View on Discogs
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>

              {/* Right column - Tracklist */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Tracklist</h3>
                {album.tracklist.length > 0 ? (
                  <div className="space-y-1 max-h-[500px] overflow-y-auto pr-2">
                    {album.tracklist.map((track, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 py-2 px-3 rounded hover:bg-neutral-800/50 transition-colors"
                      >
                        <span className="text-sm font-medium text-neutral-400 min-w-[2rem]">
                          {track.position}
                        </span>
                        <span className="text-sm text-white flex-1">
                          {track.title}
                        </span>
                        {track.duration && (
                          <span className="text-sm text-neutral-300 tabular-nums">
                            {track.duration}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-400 italic">No tracklist available</p>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>

      {/* Lightbox for zoomed image */}
      {isLightboxOpen && album && (
        <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none">
            <div
              className="relative w-full h-[95vh] flex items-center justify-center group"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <button
                onClick={() => setIsLightboxOpen(false)}
                className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                aria-label="Close lightbox"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="relative w-full h-full p-8">
                <Image
                  src={album.images[currentImageIndex]?.uri || album.coverImage}
                  alt={`${album.artist} - ${album.title}`}
                  fill
                  sizes="95vw"
                  className="object-contain"
                  priority
                />
              </div>

              {/* Navigation arrows - only show if multiple images */}
              {album.images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex((prev) =>
                      prev === 0 ? album.images.length - 1 : prev - 1
                    )}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-opacity z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100"
                    aria-label="Previous image"
                  >
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  <button
                    onClick={() => setCurrentImageIndex((prev) =>
                      prev === album.images.length - 1 ? 0 : prev + 1
                    )}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-opacity z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100"
                    aria-label="Next image"
                  >
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}

              {/* Image info and indicator dots overlay */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
                {/* Image indicator dots */}
                {album.images.length > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    {album.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`h-2 rounded-full transition-all ${
                          index === currentImageIndex
                            ? 'w-8 bg-white'
                            : 'w-2 bg-neutral-500 hover:bg-neutral-400'
                        }`}
                        aria-label={`Go to image ${index + 1}`}
                      />
                    ))}
                  </div>
                )}

                {/* Image info */}
                <div className="bg-black/70 text-white text-sm px-4 py-2 rounded whitespace-nowrap">
                  {album.artist} - {album.title}
                  {album.images.length > 1 && (
                    <span className="ml-3 text-neutral-300">
                      Image {currentImageIndex + 1} of {album.images.length}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}
