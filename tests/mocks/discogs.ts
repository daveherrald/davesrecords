import { vi } from 'vitest';
import { mockAlbums, mockAlbumDetail } from '../fixtures/albums';

/**
 * Mock Discogs API responses
 */
export function mockDiscogsResponses() {
  return {
    collectionResponse: {
      pagination: {
        page: 1,
        pages: 3,
        per_page: 100,
        items: 250,
        urls: {
          next: 'https://api.discogs.com/users/testuser/collection/folders/0/releases?page=2',
        },
      },
      releases: mockAlbums.map((album) => ({
        instance_id: album.instanceId,
        date_added: album.dateAdded,
        basic_information: {
          id: album.id,
          title: album.title,
          artists: [{ name: album.artist, id: album.id + 1000 }],
          year: album.year,
          cover_image: album.coverImage,
          thumb: album.thumbnail,
          formats: [{ name: album.format, qty: '1' }],
          labels: [{ name: album.label, catno: `CAT-${album.id}` }],
          genres: album.genres,
          styles: album.styles,
        },
      })),
    },

    releaseResponse: {
      id: mockAlbumDetail.id,
      title: mockAlbumDetail.title,
      artists: [{ name: mockAlbumDetail.artist, id: mockAlbumDetail.id + 1000 }],
      year: mockAlbumDetail.year,
      labels: [{ name: mockAlbumDetail.label, catno: mockAlbumDetail.catno }],
      formats: [{ name: mockAlbumDetail.format, descriptions: ['LP', 'Album'] }],
      genres: mockAlbumDetail.genres,
      styles: mockAlbumDetail.styles,
      tracklist: mockAlbumDetail.tracklist,
      images: mockAlbumDetail.images,
      notes: mockAlbumDetail.notes,
      uri: `https://www.discogs.com/release/${mockAlbumDetail.id}`,
      master_id: mockAlbumDetail.id + 5000,
      country: 'US',
      released: String(mockAlbumDetail.year),
    },

    identityResponse: {
      id: 12345,
      username: 'testuser',
      resource_url: 'https://api.discogs.com/users/testuser',
      consumer_name: 'Test App',
    },

    requestTokenResponse: {
      oauth_token: 'test-request-token',
      oauth_token_secret: 'test-request-token-secret',
      oauth_callback_confirmed: 'true',
    },

    accessTokenResponse: {
      oauth_token: 'test-access-token',
      oauth_token_secret: 'test-access-token-secret',
    },
  };
}

/**
 * Setup global fetch mock for Discogs API calls
 */
export function setupFetchMock(responses = mockDiscogsResponses()) {
  global.fetch = vi.fn().mockImplementation((url: string | URL | Request, options?: RequestInit) => {
    const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;

    // Collection endpoint
    if (urlStr.includes('/collection/folders/0/releases')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(responses.collectionResponse),
        headers: new Headers({ 'content-type': 'application/json' }),
      });
    }

    // Release details endpoint
    if (urlStr.match(/\/releases\/\d+/)) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(responses.releaseResponse),
        headers: new Headers({ 'content-type': 'application/json' }),
      });
    }

    // OAuth identity endpoint
    if (urlStr.includes('/oauth/identity')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(responses.identityResponse),
        headers: new Headers({ 'content-type': 'application/json' }),
      });
    }

    // OAuth request token
    if (urlStr.includes('/oauth/request_token')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve(
            `oauth_token=${responses.requestTokenResponse.oauth_token}&oauth_token_secret=${responses.requestTokenResponse.oauth_token_secret}&oauth_callback_confirmed=true`
          ),
        headers: new Headers({ 'content-type': 'application/x-www-form-urlencoded' }),
      });
    }

    // OAuth access token
    if (urlStr.includes('/oauth/access_token')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve(
            `oauth_token=${responses.accessTokenResponse.oauth_token}&oauth_token_secret=${responses.accessTokenResponse.oauth_token_secret}`
          ),
        headers: new Headers({ 'content-type': 'application/x-www-form-urlencoded' }),
      });
    }

    // Default: 404
    return Promise.resolve({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ message: 'Not Found' }),
      headers: new Headers({ 'content-type': 'application/json' }),
    });
  });

  return global.fetch;
}

/**
 * Setup fetch mock that simulates rate limiting
 */
export function setupRateLimitedFetchMock() {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    status: 429,
    json: () => Promise.resolve({ message: 'Rate limit exceeded' }),
    headers: new Headers({
      'content-type': 'application/json',
      'x-discogs-ratelimit-remaining': '0',
      'retry-after': '60',
    }),
  });

  return global.fetch;
}

/**
 * Setup fetch mock that simulates network errors
 */
export function setupNetworkErrorFetchMock() {
  global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
  return global.fetch;
}

/**
 * Setup fetch mock for invalid OAuth token
 */
export function setupInvalidTokenFetchMock() {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    status: 401,
    json: () => Promise.resolve({ message: 'Invalid consumer token' }),
    headers: new Headers({ 'content-type': 'application/json' }),
  });

  return global.fetch;
}

/**
 * Reset fetch mock to original state
 */
export function resetFetchMock() {
  vi.mocked(global.fetch).mockReset();
}
