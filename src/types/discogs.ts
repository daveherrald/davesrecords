/**
 * Discogs API Type Definitions
 */

export interface DiscogsImage {
  type: 'primary' | 'secondary';
  uri: string;
  resource_url: string;
  uri150: string;
  width: number;
  height: number;
}

export interface DiscogsBasicInfo {
  id: number;
  master_id: number;
  master_url: string | null;
  resource_url: string;
  thumb: string;
  cover_image: string;
  title: string;
  year: number;
  formats: DiscogsFormat[];
  artists: DiscogsArtist[];
  labels: DiscogsLabel[];
  genres: string[];
  styles: string[];
}

export interface DiscogsFormat {
  name: string;
  qty: string;
  descriptions?: string[];
  text?: string;
}

export interface DiscogsArtist {
  name: string;
  anv: string;
  join: string;
  role: string;
  tracks: string;
  id: number;
  resource_url: string;
}

export interface DiscogsLabel {
  name: string;
  catno: string;
  entity_type: string;
  entity_type_name: string;
  id: number;
  resource_url: string;
}

export interface DiscogsCollectionItem {
  id: number;
  instance_id: number;
  date_added: string;
  rating: number;
  basic_information: DiscogsBasicInfo;
  notes?: Array<{
    field_id: number;
    value: string;
  }>;
}

export interface DiscogsCollectionResponse {
  pagination: {
    page: number;
    pages: number;
    per_page: number;
    items: number;
    urls: {
      last?: string;
      next?: string;
    };
  };
  releases: DiscogsCollectionItem[];
}

export interface DiscogsRelease {
  id: number;
  title: string;
  year: number;
  artists: DiscogsArtist[];
  labels: DiscogsLabel[];
  formats: DiscogsFormat[];
  genres: string[];
  styles: string[];
  tracklist: DiscogsTrack[];
  images: DiscogsImage[];
  notes?: string;
  country?: string;
  uri: string;
  resource_url: string;
}

export interface DiscogsTrack {
  position: string;
  type_: string;
  title: string;
  duration: string;
  extraartists?: DiscogsArtist[];
}

export interface DiscogsIdentity {
  id: number;
  username: string;
  resource_url: string;
  consumer_name: string;
  email?: string;
}

/**
 * Simplified Album type for our UI
 */
export interface Album {
  id: number;
  instanceId: number;
  title: string;
  artist: string;
  year: number;
  coverImage: string;
  thumbnail: string;
  format: string;
  label: string;
  genres: string[];
  styles: string[];
  dateAdded: string;
}

/**
 * Detailed album information
 */
export interface AlbumDetail extends Album {
  tracklist: {
    position: string;
    title: string;
    duration: string;
  }[];
  images: DiscogsImage[];
  catalogNumber: string;
  country?: string;
  notes?: string;
  discogsUrl: string;
}
