'use client';

import { useState } from 'react';
import Image from 'next/image';
import AlbumDetail from './AlbumDetail';
import type { Album } from '@/types/discogs';

interface AlbumCardProps {
  album: Album;
  userSlug?: string;
}

export default function AlbumCard({ album, userSlug }: AlbumCardProps) {
  const [showDetail, setShowDetail] = useState(false);
  const [imageError, setImageError] = useState(false);

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

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
            <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
              <p className="text-xs font-semibold line-clamp-1">{album.artist}</p>
              <p className="text-xs line-clamp-1">{album.title}</p>
              <p className="text-xs text-neutral-300">{album.year}</p>
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
