'use client';

import { useState } from 'react';
import Image from 'next/image';
import AlbumDetail from './AlbumDetail';
import type { Album } from '@/types/discogs';

interface AlbumCardProps {
  album: Album;
  userSlug?: string;
  isOwnCollection?: boolean;
  isExcluded?: boolean;
  onToggleExclusion?: (albumId: number) => void;
}

export default function AlbumCard({
  album,
  userSlug,
  isOwnCollection,
  isExcluded,
  onToggleExclusion,
}: AlbumCardProps) {
  const [showDetail, setShowDetail] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleToggleExclusion = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening album detail
    if (onToggleExclusion) {
      onToggleExclusion(album.id);
    }
  };

  return (
    <>
      <div
        className="group cursor-pointer overflow-hidden rounded-lg transition-all hover:scale-105 hover:shadow-xl"
        onClick={() => setShowDetail(true)}
      >
        <div className="aspect-square relative bg-neutral-200">
          {!imageError ? (
            <Image
              src={album.thumbnail || album.coverImage || '/placeholder-album.png'}
              alt={`${album.artist} - ${album.title}`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-neutral-300">
              <svg
                className="h-12 w-12 text-neutral-400"
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

          <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent ${isExcluded ? 'opacity-100' : 'opacity-0 transition-opacity group-hover:opacity-100'}`}>
            {isOwnCollection && (
              <button
                onClick={handleToggleExclusion}
                className={`absolute top-2 right-2 p-2 rounded-full transition-colors ${
                  isExcluded
                    ? 'bg-red-500/90 hover:bg-red-600'
                    : 'bg-neutral-800/90 hover:bg-neutral-700'
                }`}
                title={isExcluded ? 'Show in public gallery' : 'Hide from public gallery'}
              >
                {isExcluded ? (
                  <svg
                    className="h-4 w-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-4 w-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            )}
            <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
              <p className="text-xs font-semibold line-clamp-1">{album.artist}</p>
              <p className="text-xs line-clamp-1">{album.title}</p>
              <p className="text-xs text-neutral-300">{album.year}</p>
              {isExcluded && (
                <p className="text-xs text-red-300 mt-1">Hidden from public</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {showDetail && (
        <AlbumDetail
          albumId={album.id}
          userSlug={userSlug}
          onClose={() => setShowDetail(false)}
        />
      )}
    </>
  );
}
