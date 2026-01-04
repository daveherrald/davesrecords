import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AlbumDetail from '../collection/AlbumDetail';

// Mock next/image
vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    onError,
    onClick,
  }: {
    src: string;
    alt: string;
    onError?: () => void;
    onClick?: () => void;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={onError}
      onClick={onClick}
      data-testid="album-detail-image"
    />
  ),
}));

// Mock Dialog components
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-content">{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-header">{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <h2 data-testid="dialog-title">{children}</h2>
  ),
}));

// Mock Skeleton component
vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

const mockAlbumData = {
  id: 12345,
  title: 'Abbey Road',
  artist: 'The Beatles',
  year: 1969,
  coverImage: 'https://example.com/cover.jpg',
  format: 'Vinyl, LP, Album',
  label: 'Apple Records',
  catalogNumber: 'PCS 7088',
  country: 'UK',
  genres: ['Rock', 'Pop'],
  styles: ['Pop Rock', 'Psychedelic Rock'],
  notes: 'Classic Beatles album',
  discogsUrl: 'https://www.discogs.com/release/12345',
  images: [
    { uri: 'https://example.com/img1.jpg', uri150: 'https://example.com/img1-thumb.jpg', type: 'primary', width: 600, height: 600 },
    { uri: 'https://example.com/img2.jpg', uri150: 'https://example.com/img2-thumb.jpg', type: 'secondary', width: 600, height: 600 },
  ],
  tracklist: [
    { position: 'A1', title: 'Come Together', duration: '4:19' },
    { position: 'A2', title: 'Something', duration: '3:02' },
    { position: 'B1', title: 'Here Comes the Sun', duration: '3:05' },
  ],
};

describe('AlbumDetail', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loading state', () => {
    it('shows loading skeletons while fetching', async () => {
      mockFetch.mockReturnValue(new Promise(() => {})); // Never resolves

      render(<AlbumDetail albumId={12345} onClose={vi.fn()} />);

      expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
    });
  });

  describe('error state', () => {
    it('displays error message when API call fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Album not found' }),
      });

      render(<AlbumDetail albumId={12345} onClose={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument();
        expect(screen.getByText('Album not found')).toBeInTheDocument();
      });
    });

    it('displays generic error when API throws', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      render(<AlbumDetail albumId={12345} onClose={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });
  });

  describe('successful data display', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockAlbumData),
      });
    });

    it('displays album title and artist in header', async () => {
      render(<AlbumDetail albumId={12345} onClose={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('The Beatles - Abbey Road')).toBeInTheDocument();
      });
    });

    it('displays album metadata (year, label, catalog number)', async () => {
      render(<AlbumDetail albumId={12345} onClose={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText(/1969/)).toBeInTheDocument();
        expect(screen.getByText(/Apple Records/)).toBeInTheDocument();
        expect(screen.getByText(/PCS 7088/)).toBeInTheDocument();
      });
    });

    it('displays format and country', async () => {
      render(<AlbumDetail albumId={12345} onClose={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('Vinyl, LP, Album')).toBeInTheDocument();
        expect(screen.getByText('UK')).toBeInTheDocument();
      });
    });

    it('displays genres and styles', async () => {
      render(<AlbumDetail albumId={12345} onClose={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('Rock, Pop')).toBeInTheDocument();
        expect(screen.getByText('Pop Rock, Psychedelic Rock')).toBeInTheDocument();
      });
    });

    it('displays notes when available', async () => {
      render(<AlbumDetail albumId={12345} onClose={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('Classic Beatles album')).toBeInTheDocument();
      });
    });

    it('displays tracklist', async () => {
      render(<AlbumDetail albumId={12345} onClose={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('Come Together')).toBeInTheDocument();
        expect(screen.getByText('Something')).toBeInTheDocument();
        expect(screen.getByText('Here Comes the Sun')).toBeInTheDocument();
      });
    });

    it('displays track positions and durations', async () => {
      render(<AlbumDetail albumId={12345} onClose={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('A1')).toBeInTheDocument();
        expect(screen.getByText('4:19')).toBeInTheDocument();
      });
    });

    it('displays Discogs link', async () => {
      render(<AlbumDetail albumId={12345} onClose={vi.fn()} />);

      await waitFor(() => {
        const link = screen.getByText('View on Discogs');
        expect(link).toHaveAttribute('href', 'https://www.discogs.com/release/12345');
        expect(link).toHaveAttribute('target', '_blank');
      });
    });
  });

  describe('API URL construction', () => {
    it('fetches with albumId only when no userSlug provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockAlbumData),
      });

      render(<AlbumDetail albumId={12345} onClose={vi.fn()} />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/release/12345');
      });
    });

    it('fetches with userSlug query param when provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockAlbumData),
      });

      render(<AlbumDetail albumId={12345} userSlug="testuser" onClose={vi.fn()} />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/release/12345?slug=testuser');
      });
    });
  });

  describe('image navigation', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockAlbumData),
      });
    });

    it('shows image counter for multiple images', async () => {
      render(<AlbumDetail albumId={12345} onClose={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('1 / 2')).toBeInTheDocument();
      });
    });

    it('shows navigation dots for multiple images', async () => {
      render(<AlbumDetail albumId={12345} onClose={vi.fn()} />);

      await waitFor(() => {
        const dots = screen.getAllByRole('button', { name: /Go to image/i });
        expect(dots.length).toBe(2);
      });
    });

    it('changes image when dot is clicked', async () => {
      render(<AlbumDetail albumId={12345} onClose={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('1 / 2')).toBeInTheDocument();
      });

      const secondDot = screen.getByRole('button', { name: 'Go to image 2' });
      fireEvent.click(secondDot);

      await waitFor(() => {
        expect(screen.getByText('2 / 2')).toBeInTheDocument();
      });
    });

    it('does not show navigation controls for single image', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          ...mockAlbumData,
          images: [mockAlbumData.images[0]],
        }),
      });

      render(<AlbumDetail albumId={12345} onClose={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('The Beatles - Abbey Road')).toBeInTheDocument();
      });

      expect(screen.queryByText(/\d+ \/ \d+/)).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Go to image/i })).not.toBeInTheDocument();
    });
  });

  describe('keyboard navigation', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockAlbumData),
      });
    });

    it('responds to arrow keys when lightbox is open', async () => {
      render(<AlbumDetail albumId={12345} onClose={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('1 / 2')).toBeInTheDocument();
      });

      // Open lightbox by clicking image
      const image = screen.getByTestId('album-detail-image');
      fireEvent.click(image);

      // Navigate with arrow key
      fireEvent.keyDown(window, { key: 'ArrowRight' });

      await waitFor(() => {
        // Should show "2 / 2" somewhere in the document
        expect(screen.getByText('2 / 2')).toBeInTheDocument();
      });
    });
  });

  describe('empty/missing data handling', () => {
    it('shows "No tracklist available" when tracklist is empty', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          ...mockAlbumData,
          tracklist: [],
        }),
      });

      render(<AlbumDetail albumId={12345} onClose={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('No tracklist available')).toBeInTheDocument();
      });
    });

    it('hides notes section when notes not available', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          ...mockAlbumData,
          notes: undefined,
        }),
      });

      render(<AlbumDetail albumId={12345} onClose={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('The Beatles - Abbey Road')).toBeInTheDocument();
      });

      expect(screen.queryByText('Notes')).not.toBeInTheDocument();
    });

    it('hides country when not available', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          ...mockAlbumData,
          country: undefined,
        }),
      });

      render(<AlbumDetail albumId={12345} onClose={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('The Beatles - Abbey Road')).toBeInTheDocument();
      });

      expect(screen.queryByText('Country')).not.toBeInTheDocument();
    });

    it('hides genres section when empty', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          ...mockAlbumData,
          genres: [],
        }),
      });

      render(<AlbumDetail albumId={12345} onClose={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('The Beatles - Abbey Road')).toBeInTheDocument();
      });

      expect(screen.queryByText('Genre')).not.toBeInTheDocument();
    });
  });

  describe('refetching on prop change', () => {
    it('refetches when albumId changes', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockAlbumData),
      });

      const { rerender } = render(<AlbumDetail albumId={12345} onClose={vi.fn()} />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/release/12345');
      });

      mockFetch.mockClear();

      rerender(<AlbumDetail albumId={67890} onClose={vi.fn()} />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/release/67890');
      });
    });
  });
});
