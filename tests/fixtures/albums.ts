/**
 * Mock album data for collection tests
 * Represents the transformed album format used in the app
 */
export interface MockAlbum {
  id: number;
  instanceId: number;
  title: string;
  artist: string;
  year: number;
  label: string;
  format: string;
  coverImage: string;
  thumbnail: string;
  genres: string[];
  styles: string[];
  dateAdded: string;
}

export const mockAlbums: MockAlbum[] = [
  {
    id: 1001,
    instanceId: 500001,
    title: 'Abbey Road',
    artist: 'The Beatles',
    year: 1969,
    label: 'Apple Records',
    format: 'Vinyl',
    coverImage: 'https://i.discogs.com/abbey-road-cover.jpg',
    thumbnail: 'https://i.discogs.com/abbey-road-thumb.jpg',
    genres: ['Rock'],
    styles: ['Pop Rock', 'Psychedelic Rock'],
    dateAdded: '2024-01-15T10:30:00Z',
  },
  {
    id: 1002,
    instanceId: 500002,
    title: 'Kind of Blue',
    artist: 'Miles Davis',
    year: 1959,
    label: 'Columbia',
    format: 'Vinyl',
    coverImage: 'https://i.discogs.com/kind-of-blue-cover.jpg',
    thumbnail: 'https://i.discogs.com/kind-of-blue-thumb.jpg',
    genres: ['Jazz'],
    styles: ['Modal', 'Cool Jazz'],
    dateAdded: '2024-01-10T15:45:00Z',
  },
  {
    id: 1003,
    instanceId: 500003,
    title: 'Rumours',
    artist: 'Fleetwood Mac',
    year: 1977,
    label: 'Warner Bros.',
    format: 'Vinyl',
    coverImage: 'https://i.discogs.com/rumours-cover.jpg',
    thumbnail: 'https://i.discogs.com/rumours-thumb.jpg',
    genres: ['Rock'],
    styles: ['Pop Rock', 'Soft Rock'],
    dateAdded: '2024-01-20T09:00:00Z',
  },
  {
    id: 1004,
    instanceId: 500004,
    title: 'Thriller',
    artist: 'Michael Jackson',
    year: 1982,
    label: 'Epic',
    format: 'Vinyl',
    coverImage: 'https://i.discogs.com/thriller-cover.jpg',
    thumbnail: 'https://i.discogs.com/thriller-thumb.jpg',
    genres: ['Electronic', 'Funk / Soul', 'Pop'],
    styles: ['Disco', 'Soul', 'Synth-pop'],
    dateAdded: '2024-02-01T12:00:00Z',
  },
  {
    id: 1005,
    instanceId: 500005,
    title: 'The Dark Side of the Moon',
    artist: 'Pink Floyd',
    year: 1973,
    label: 'Harvest',
    format: 'Vinyl',
    coverImage: 'https://i.discogs.com/dark-side-cover.jpg',
    thumbnail: 'https://i.discogs.com/dark-side-thumb.jpg',
    genres: ['Rock'],
    styles: ['Prog Rock', 'Psychedelic Rock'],
    dateAdded: '2023-12-25T18:30:00Z',
  },
  {
    id: 1006,
    instanceId: 500006,
    title: 'Blue',
    artist: 'Joni Mitchell',
    year: 1971,
    label: 'Reprise',
    format: 'Vinyl',
    coverImage: 'https://i.discogs.com/blue-cover.jpg',
    thumbnail: 'https://i.discogs.com/blue-thumb.jpg',
    genres: ['Rock', 'Folk, World, & Country'],
    styles: ['Folk Rock', 'Acoustic'],
    dateAdded: '2024-01-05T14:15:00Z',
  },
  {
    id: 1007,
    instanceId: 500007,
    title: 'Nevermind',
    artist: 'Nirvana',
    year: 1991,
    label: 'DGC',
    format: 'Vinyl',
    coverImage: 'https://i.discogs.com/nevermind-cover.jpg',
    thumbnail: 'https://i.discogs.com/nevermind-thumb.jpg',
    genres: ['Rock'],
    styles: ['Grunge', 'Alternative Rock'],
    dateAdded: '2024-02-10T11:00:00Z',
  },
  {
    id: 1008,
    instanceId: 500008,
    title: 'Random Access Memories',
    artist: 'Daft Punk',
    year: 2013,
    label: 'Columbia',
    format: 'Vinyl',
    coverImage: 'https://i.discogs.com/ram-cover.jpg',
    thumbnail: 'https://i.discogs.com/ram-thumb.jpg',
    genres: ['Electronic'],
    styles: ['Disco', 'Synth-pop'],
    dateAdded: '2024-02-15T16:45:00Z',
  },
];

/**
 * Mock album detail response (from Discogs release endpoint)
 */
export interface MockAlbumDetail {
  id: number;
  title: string;
  artist: string;
  year: number;
  label: string;
  catno: string;
  format: string;
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
    type: 'primary' | 'secondary';
    width: number;
    height: number;
  }>;
  notes: string;
  discogsUrl: string;
}

export const mockAlbumDetail: MockAlbumDetail = {
  id: 1001,
  title: 'Abbey Road',
  artist: 'The Beatles',
  year: 1969,
  label: 'Apple Records',
  catno: 'PCS 7088',
  format: 'Vinyl',
  genres: ['Rock'],
  styles: ['Pop Rock', 'Psychedelic Rock'],
  tracklist: [
    { position: 'A1', title: 'Come Together', duration: '4:19' },
    { position: 'A2', title: 'Something', duration: '3:02' },
    { position: 'A3', title: 'Maxwell\'s Silver Hammer', duration: '3:27' },
    { position: 'A4', title: 'Oh! Darling', duration: '3:27' },
    { position: 'A5', title: "Octopus's Garden", duration: '2:51' },
    { position: 'A6', title: 'I Want You (She\'s So Heavy)', duration: '7:47' },
    { position: 'B1', title: 'Here Comes The Sun', duration: '3:05' },
    { position: 'B2', title: 'Because', duration: '2:45' },
    { position: 'B3', title: 'You Never Give Me Your Money', duration: '4:02' },
    { position: 'B4', title: 'Sun King', duration: '2:26' },
    { position: 'B5', title: 'Mean Mr. Mustard', duration: '1:06' },
    { position: 'B6', title: 'Polythene Pam', duration: '1:12' },
    { position: 'B7', title: 'She Came In Through The Bathroom Window', duration: '1:57' },
    { position: 'B8', title: 'Golden Slumbers', duration: '1:31' },
    { position: 'B9', title: 'Carry That Weight', duration: '1:36' },
    { position: 'B10', title: 'The End', duration: '2:19' },
    { position: 'B11', title: 'Her Majesty', duration: '0:23' },
  ],
  images: [
    {
      uri: 'https://i.discogs.com/abbey-road-full-1.jpg',
      uri150: 'https://i.discogs.com/abbey-road-thumb-1.jpg',
      type: 'primary',
      width: 600,
      height: 600,
    },
    {
      uri: 'https://i.discogs.com/abbey-road-full-2.jpg',
      uri150: 'https://i.discogs.com/abbey-road-thumb-2.jpg',
      type: 'secondary',
      width: 600,
      height: 600,
    },
    {
      uri: 'https://i.discogs.com/abbey-road-full-3.jpg',
      uri150: 'https://i.discogs.com/abbey-road-thumb-3.jpg',
      type: 'secondary',
      width: 600,
      height: 600,
    },
  ],
  notes: 'Original UK pressing. Gatefold sleeve.',
  discogsUrl: 'https://www.discogs.com/release/1001',
};

/**
 * Helper to get album by ID
 */
export function getAlbumById(id: number): MockAlbum | undefined {
  return mockAlbums.find((a) => a.id === id);
}

/**
 * Helper to filter albums by year range
 */
export function getAlbumsByYearRange(minYear: number, maxYear: number): MockAlbum[] {
  return mockAlbums.filter((a) => a.year >= minYear && a.year <= maxYear);
}

/**
 * Helper to filter albums by genre
 */
export function getAlbumsByGenre(genre: string): MockAlbum[] {
  return mockAlbums.filter((a) => a.genres.some((g) => g.toLowerCase().includes(genre.toLowerCase())));
}

/**
 * Helper to search albums by artist or title
 */
export function searchAlbums(query: string): MockAlbum[] {
  const lowerQuery = query.toLowerCase();
  return mockAlbums.filter(
    (a) => a.artist.toLowerCase().includes(lowerQuery) || a.title.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Helper to sort albums
 */
export function sortAlbums(albums: MockAlbum[], sortBy: 'artist' | 'year' | 'title' | 'dateAdded'): MockAlbum[] {
  return [...albums].sort((a, b) => {
    switch (sortBy) {
      case 'artist':
        return a.artist.localeCompare(b.artist);
      case 'year':
        return b.year - a.year; // Newest first
      case 'title':
        return a.title.localeCompare(b.title);
      case 'dateAdded':
        return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
      default:
        return 0;
    }
  });
}

/**
 * Mock excluded album IDs (for testing exclusion filtering)
 */
export const mockExcludedAlbumIds = new Set(['1003', '1007']); // Rumours and Nevermind

/**
 * Get albums excluding the mock excluded IDs
 */
export function getPublicAlbums(): MockAlbum[] {
  return mockAlbums.filter((a) => !mockExcludedAlbumIds.has(String(a.id)));
}
