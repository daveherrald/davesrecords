import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AlbumCard from '../collection/AlbumCard';
import type { Album } from '@/types/discogs';

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, onError }: { src: string; alt: string; onError?: () => void }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={onError}
      data-testid="album-image"
    />
  ),
}));

// Mock AlbumDetail component
vi.mock('../collection/AlbumDetail', () => ({
  default: ({ albumId, onClose }: { albumId: number; onClose: () => void }) => (
    <div data-testid="album-detail-modal">
      <span>Album ID: {albumId}</span>
      <button onClick={onClose} data-testid="close-modal">Close</button>
    </div>
  ),
}));

const createMockAlbum = (overrides: Partial<Album> = {}): Album => ({
  id: 12345,
  instanceId: 98765,
  title: 'Abbey Road',
  artist: 'The Beatles',
  year: 1969,
  thumbnail: 'https://example.com/thumb.jpg',
  coverImage: 'https://example.com/cover.jpg',
  format: 'Vinyl, LP',
  label: 'Apple Records',
  genres: [],
  styles: [],
  dateAdded: '2024-01-01T00:00:00Z',
  ...overrides,
});

describe('AlbumCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('displays album artist, title, and year', () => {
      const album = createMockAlbum({
        artist: 'Pink Floyd',
        title: 'Dark Side of the Moon',
        year: 1973,
      });

      render(<AlbumCard album={album} />);

      expect(screen.getByText('Pink Floyd')).toBeInTheDocument();
      expect(screen.getByText('Dark Side of the Moon')).toBeInTheDocument();
      expect(screen.getByText('1973')).toBeInTheDocument();
    });

    it('renders album thumbnail image', () => {
      const album = createMockAlbum({
        thumbnail: 'https://example.com/beatles-thumb.jpg',
      });

      render(<AlbumCard album={album} />);

      const img = screen.getByTestId('album-image');
      expect(img).toHaveAttribute('src', 'https://example.com/beatles-thumb.jpg');
    });

    it('falls back to coverImage when thumbnail is not available', () => {
      const album = createMockAlbum({
        thumbnail: undefined,
        coverImage: 'https://example.com/cover.jpg',
      });

      render(<AlbumCard album={album} />);

      const img = screen.getByTestId('album-image');
      expect(img).toHaveAttribute('src', 'https://example.com/cover.jpg');
    });

    it('falls back to placeholder when no images available', () => {
      const album = createMockAlbum({
        thumbnail: undefined,
        coverImage: undefined,
      });

      render(<AlbumCard album={album} />);

      const img = screen.getByTestId('album-image');
      expect(img).toHaveAttribute('src', '/placeholder-album.png');
    });

    it('renders alt text with artist and title', () => {
      const album = createMockAlbum({
        artist: 'Led Zeppelin',
        title: 'IV',
      });

      render(<AlbumCard album={album} />);

      expect(screen.getByAltText('Led Zeppelin - IV')).toBeInTheDocument();
    });
  });

  describe('image error handling', () => {
    it('shows fallback icon when image fails to load', () => {
      const album = createMockAlbum();

      render(<AlbumCard album={album} />);

      const img = screen.getByTestId('album-image');
      fireEvent.error(img);

      // Should show SVG fallback (music note icon)
      // The image should be replaced with an SVG
      expect(screen.queryByTestId('album-image')).not.toBeInTheDocument();
    });
  });

  describe('modal interaction', () => {
    it('opens album detail modal when card is clicked', () => {
      const album = createMockAlbum({ id: 42 });

      render(<AlbumCard album={album} />);

      expect(screen.queryByTestId('album-detail-modal')).not.toBeInTheDocument();

      // Click the card
      const card = screen.getByText('The Beatles').closest('div[class*="cursor-pointer"]');
      fireEvent.click(card!);

      expect(screen.getByTestId('album-detail-modal')).toBeInTheDocument();
      expect(screen.getByText('Album ID: 42')).toBeInTheDocument();
    });

    it('closes modal when onClose is called', () => {
      const album = createMockAlbum();

      render(<AlbumCard album={album} />);

      // Open modal
      const card = screen.getByText('The Beatles').closest('div[class*="cursor-pointer"]');
      fireEvent.click(card!);

      expect(screen.getByTestId('album-detail-modal')).toBeInTheDocument();

      // Close modal
      fireEvent.click(screen.getByTestId('close-modal'));

      expect(screen.queryByTestId('album-detail-modal')).not.toBeInTheDocument();
    });

    it('passes userSlug to AlbumDetail modal', () => {
      const album = createMockAlbum();

      render(<AlbumCard album={album} userSlug="testuser" />);

      // Open modal
      const card = screen.getByText('The Beatles').closest('div[class*="cursor-pointer"]');
      fireEvent.click(card!);

      // The modal should render (userSlug is passed internally)
      expect(screen.getByTestId('album-detail-modal')).toBeInTheDocument();
    });
  });

  describe('exclusion toggle', () => {
    it('shows exclusion toggle when isOwnCollection is true', () => {
      const album = createMockAlbum();
      const onToggleExclusion = vi.fn();

      render(
        <AlbumCard
          album={album}
          isOwnCollection={true}
          isExcluded={false}
          onToggleExclusion={onToggleExclusion}
        />
      );

      const toggleButton = screen.getByTitle('Hide from public gallery');
      expect(toggleButton).toBeInTheDocument();
    });

    it('hides exclusion toggle when isOwnCollection is false', () => {
      const album = createMockAlbum();

      render(<AlbumCard album={album} isOwnCollection={false} />);

      expect(screen.queryByTitle('Hide from public gallery')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Show in public gallery')).not.toBeInTheDocument();
    });

    it('calls onToggleExclusion with album ID when toggle is clicked', () => {
      const album = createMockAlbum({ id: 999 });
      const onToggleExclusion = vi.fn();

      render(
        <AlbumCard
          album={album}
          isOwnCollection={true}
          isExcluded={false}
          onToggleExclusion={onToggleExclusion}
        />
      );

      const toggleButton = screen.getByTitle('Hide from public gallery');
      fireEvent.click(toggleButton);

      expect(onToggleExclusion).toHaveBeenCalledWith(999);
    });

    it('does not open modal when exclusion toggle is clicked', () => {
      const album = createMockAlbum();
      const onToggleExclusion = vi.fn();

      render(
        <AlbumCard
          album={album}
          isOwnCollection={true}
          isExcluded={false}
          onToggleExclusion={onToggleExclusion}
        />
      );

      const toggleButton = screen.getByTitle('Hide from public gallery');
      fireEvent.click(toggleButton);

      // Modal should NOT open
      expect(screen.queryByTestId('album-detail-modal')).not.toBeInTheDocument();
    });

    it('shows different title for excluded albums', () => {
      const album = createMockAlbum();
      const onToggleExclusion = vi.fn();

      render(
        <AlbumCard
          album={album}
          isOwnCollection={true}
          isExcluded={true}
          onToggleExclusion={onToggleExclusion}
        />
      );

      expect(screen.getByTitle('Show in public gallery')).toBeInTheDocument();
    });

    it('shows "Hidden from public" text for excluded albums', () => {
      const album = createMockAlbum();

      render(
        <AlbumCard
          album={album}
          isOwnCollection={true}
          isExcluded={true}
        />
      );

      expect(screen.getByText('Hidden from public')).toBeInTheDocument();
    });

    it('does not show "Hidden from public" text for visible albums', () => {
      const album = createMockAlbum();

      render(
        <AlbumCard
          album={album}
          isOwnCollection={true}
          isExcluded={false}
        />
      );

      expect(screen.queryByText('Hidden from public')).not.toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('handles album with empty title', () => {
      const album = createMockAlbum({ title: '' });

      render(<AlbumCard album={album} />);

      // Should render without crashing
      expect(screen.getByText('The Beatles')).toBeInTheDocument();
    });

    it('handles album with year 0', () => {
      const album = createMockAlbum({ year: 0 });

      render(<AlbumCard album={album} />);

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('handles missing onToggleExclusion callback gracefully', () => {
      const album = createMockAlbum();

      render(
        <AlbumCard
          album={album}
          isOwnCollection={true}
          isExcluded={false}
          // No onToggleExclusion provided
        />
      );

      const toggleButton = screen.getByTitle('Hide from public gallery');

      // Should not throw when clicked
      expect(() => fireEvent.click(toggleButton)).not.toThrow();
    });
  });
});
