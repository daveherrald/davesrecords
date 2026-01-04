import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AlbumGrid from '../collection/AlbumGrid';
import type { Album } from '@/types/discogs';

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, onError }: { src: string; alt: string; onError?: () => void }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} onError={onError} data-testid="album-image" />
  ),
}));

// Mock AlbumDetail since we're testing AlbumGrid in isolation
vi.mock('../collection/AlbumDetail', () => ({
  default: () => <div data-testid="album-detail-modal">Album Detail Modal</div>,
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

describe('AlbumGrid', () => {
  describe('rendering', () => {
    it('renders nothing when albums array is empty', () => {
      render(<AlbumGrid albums={[]} />);

      // Should have the grid container but no album cards
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('renders all albums in the array', () => {
      const albums = [
        createMockAlbum({ id: 1, instanceId: 101, title: 'Abbey Road' }),
        createMockAlbum({ id: 2, instanceId: 102, title: 'Let It Be' }),
        createMockAlbum({ id: 3, instanceId: 103, title: 'Revolver' }),
      ];

      render(<AlbumGrid albums={albums} />);

      expect(screen.getByText('Abbey Road')).toBeInTheDocument();
      expect(screen.getByText('Let It Be')).toBeInTheDocument();
      expect(screen.getByText('Revolver')).toBeInTheDocument();
    });

    it('renders album images with alt text', () => {
      const albums = [createMockAlbum({ artist: 'Pink Floyd', title: 'The Wall' })];

      render(<AlbumGrid albums={albums} />);

      const img = screen.getByAltText('Pink Floyd - The Wall');
      expect(img).toBeInTheDocument();
    });

    it('uses instanceId as key for uniqueness', () => {
      // Same album ID but different instances (e.g., multiple copies)
      const albums = [
        createMockAlbum({ id: 1, instanceId: 101, title: 'Copy 1' }),
        createMockAlbum({ id: 1, instanceId: 102, title: 'Copy 2' }),
      ];

      render(<AlbumGrid albums={albums} />);

      expect(screen.getByText('Copy 1')).toBeInTheDocument();
      expect(screen.getByText('Copy 2')).toBeInTheDocument();
    });
  });

  describe('exclusion state', () => {
    it('marks albums as excluded based on excludedIds', () => {
      const albums = [
        createMockAlbum({ id: 1, instanceId: 101 }),
        createMockAlbum({ id: 2, instanceId: 102 }),
      ];
      const excludedIds = new Set(['1']);

      render(
        <AlbumGrid
          albums={albums}
          isOwnCollection={true}
          excludedIds={excludedIds}
        />
      );

      // The hidden text should appear for excluded albums
      expect(screen.getByText('Hidden from public')).toBeInTheDocument();
    });

    it('shows exclusion toggle buttons when isOwnCollection is true', () => {
      const albums = [createMockAlbum()];
      const onToggleExclusion = vi.fn();

      render(
        <AlbumGrid
          albums={albums}
          isOwnCollection={true}
          excludedIds={new Set()}
          onToggleExclusion={onToggleExclusion}
        />
      );

      // Should have an exclusion toggle button
      const toggleButton = screen.getByTitle('Hide from public gallery');
      expect(toggleButton).toBeInTheDocument();
    });

    it('hides exclusion toggle buttons when isOwnCollection is false', () => {
      const albums = [createMockAlbum()];

      render(
        <AlbumGrid
          albums={albums}
          isOwnCollection={false}
          excludedIds={new Set()}
        />
      );

      expect(screen.queryByTitle('Hide from public gallery')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Show in public gallery')).not.toBeInTheDocument();
    });
  });

  describe('props passing', () => {
    it('passes userSlug to AlbumCard components', () => {
      const albums = [createMockAlbum()];

      // This test verifies props are passed - the actual functionality
      // is tested in AlbumCard tests
      render(<AlbumGrid albums={albums} userSlug="testuser" />);

      // Component renders without errors
      expect(screen.getByText('The Beatles')).toBeInTheDocument();
    });

    it('passes onToggleExclusion to AlbumCard components', () => {
      const albums = [createMockAlbum()];
      const onToggleExclusion = vi.fn();

      render(
        <AlbumGrid
          albums={albums}
          isOwnCollection={true}
          excludedIds={new Set()}
          onToggleExclusion={onToggleExclusion}
        />
      );

      expect(screen.getByText('The Beatles')).toBeInTheDocument();
    });
  });

  describe('grid layout', () => {
    it('renders with responsive grid classes', () => {
      const albums = [createMockAlbum()];

      const { container } = render(<AlbumGrid albums={albums} />);

      const grid = container.firstChild;
      expect(grid).toHaveClass('grid');
      expect(grid).toHaveClass('grid-cols-2');
    });
  });
});
