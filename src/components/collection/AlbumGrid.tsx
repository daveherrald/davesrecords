import AlbumCard from './AlbumCard';
import type { Album } from '@/types/discogs';

interface AlbumGridProps {
  albums: Album[];
}

export default function AlbumGrid({ albums }: AlbumGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {albums.map((album) => (
        <AlbumCard key={album.instanceId} album={album} />
      ))}
    </div>
  );
}
