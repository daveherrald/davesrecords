'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [disconnecting, setDisconnecting] = useState(false);
  const [connections, setConnections] = useState<Array<{
    id: string;
    discogsUsername: string;
    name: string;
    isPrimary: boolean;
    connectedAt: string;
  }>>([]);
  const [editingConnectionId, setEditingConnectionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [userData, setUserData] = useState<{
    hasDiscogsConnection: boolean;
    discogsUsername?: string | null;
  } | null>(null);

  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    publicSlug: '',
    defaultSort: 'artist',
    itemsPerPage: '50',
    isPublic: 'true',
    albumCountDisplay: 'PUBLIC_ONLY',
  });

  // Load user data and connections on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userResponse, connectionsResponse] = await Promise.all([
          fetch('/api/user/me'),
          fetch('/api/auth/discogs/connections'),
        ]);

        if (userResponse.ok) {
          const data = await userResponse.json();
          setUserData(data.user);
        }

        if (connectionsResponse.ok) {
          const data = await connectionsResponse.json();
          setConnections(data.connections || []);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    fetchData();

    // Check for success/error messages from query params
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    if (success === 'DiscogsConnected') {
      setMessage('Discogs account connected successfully!');
      // Refetch connections after successful connection
      fetch('/api/auth/discogs/connections')
        .then(res => res.json())
        .then(data => setConnections(data.connections || []))
        .catch(console.error);
    } else if (error) {
      setMessage(`Error: ${error}`);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          itemsPerPage: parseInt(formData.itemsPerPage, 10),
          isPublic: formData.isPublic === 'true',
          albumCountDisplay: formData.albumCountDisplay,
        }),
      });

      if (response.ok) {
        setMessage('Settings saved successfully!');
        setTimeout(() => router.push('/dashboard'), 1500);
      } else {
        const error = await response.json();
        setMessage(error.error || 'Failed to save settings');
      }
    } catch (error) {
      setMessage('An error occurred while saving settings');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectConnection = async (connectionId: string, connectionName: string) => {
    if (!confirm(`Are you sure you want to disconnect "${connectionName}"? This collection will no longer be accessible until you reconnect.`)) {
      return;
    }

    setDisconnecting(true);
    setMessage('');

    try {
      const response = await fetch(`/api/auth/discogs/connections/${connectionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage('Connection disconnected successfully!');
        // Refetch connections
        const connectionsResponse = await fetch('/api/auth/discogs/connections');
        if (connectionsResponse.ok) {
          const data = await connectionsResponse.json();
          setConnections(data.connections || []);
        }
        // Refresh user data to update hasDiscogsConnection
        const userResponse = await fetch('/api/user/me');
        if (userResponse.ok) {
          const data = await userResponse.json();
          setUserData(data.user);
        }
      } else {
        setMessage('Failed to disconnect connection');
      }
    } catch (error) {
      setMessage('An error occurred while disconnecting');
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSetPrimary = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/auth/discogs/connections/${connectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setPrimary: true }),
      });

      if (response.ok) {
        setMessage('Primary connection updated!');
        // Refetch connections
        const connectionsResponse = await fetch('/api/auth/discogs/connections');
        if (connectionsResponse.ok) {
          const data = await connectionsResponse.json();
          setConnections(data.connections || []);
        }
      } else {
        setMessage('Failed to update primary connection');
      }
    } catch (error) {
      setMessage('An error occurred');
    }
  };

  const handleSaveName = async (connectionId: string) => {
    if (!editingName.trim()) return;

    try {
      const response = await fetch(`/api/auth/discogs/connections/${connectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingName }),
      });

      if (response.ok) {
        setMessage('Connection name updated!');
        // Refetch connections
        const connectionsResponse = await fetch('/api/auth/discogs/connections');
        if (connectionsResponse.ok) {
          const data = await connectionsResponse.json();
          setConnections(data.connections || []);
        }
        setEditingConnectionId(null);
        setEditingName('');
      } else {
        setMessage('Failed to update connection name');
      }
    } catch (error) {
      setMessage('An error occurred');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 p-4">
      <div className="mx-auto max-w-2xl space-y-8 py-8">
        <div className="space-y-2">
          <Link href="/dashboard">
            <Button variant="ghost" className="text-neutral-300 hover:text-white">
              ← Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-4xl font-bold tracking-tight text-white">
            Settings
          </h1>
          <p className="text-lg text-neutral-300">
            Customize your collection display and preferences
          </p>
        </div>

        {/* Discogs Connections Card */}
        <Card>
          <CardHeader>
            <CardTitle>Discogs Connections</CardTitle>
            <CardDescription>
              Connect up to 2 Discogs accounts to display your vinyl collections (limit: 2 accounts)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {connections.length === 0 ? (
              <div className="space-y-4">
                <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
                  <p className="text-sm font-medium text-yellow-900">
                    No connections
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Connect your Discogs account to display your vinyl collection to visitors.
                  </p>
                </div>
                <Link href="/api/auth/discogs/connect">
                  <Button className="w-full bg-black hover:bg-neutral-800">
                    <svg
                      className="mr-2 h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                    Connect Discogs Account
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {/* List of connections */}
                {connections.map((connection) => (
                  <div key={connection.id} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {editingConnectionId === connection.id ? (
                          <div className="flex gap-2 mb-2">
                            <Input
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              placeholder="Connection name"
                              className="flex-1"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleSaveName(connection.id)}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingConnectionId(null);
                                setEditingName('');
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{connection.name}</p>
                            {connection.isPrimary && (
                              <span className="text-xs bg-neutral-900 text-white px-2 py-0.5 rounded">
                                Primary
                              </span>
                            )}
                          </div>
                        )}
                        <p className="text-sm text-neutral-600">@{connection.discogsUsername}</p>
                        <p className="text-xs text-neutral-500 mt-1">
                          Connected {new Date(connection.connectedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap">
                      {editingConnectionId !== connection.id && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingConnectionId(connection.id);
                              setEditingName(connection.name);
                            }}
                          >
                            Edit Name
                          </Button>
                          {!connection.isPrimary && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSetPrimary(connection.id)}
                            >
                              Set as Primary
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDisconnectConnection(connection.id, connection.name)}
                            disabled={disconnecting}
                          >
                            Disconnect
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}

                {/* Add another account button */}
                {connections.length < 2 && (
                  <Link href="/api/auth/discogs/connect">
                    <Button className="w-full bg-black hover:bg-neutral-800">
                      <svg
                        className="mr-2 h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                      Add Another Discogs Account
                    </Button>
                  </Link>
                )}

                {connections.length >= 2 && (
                  <div className="rounded-lg bg-neutral-100 border p-3 text-center">
                    <p className="text-sm text-neutral-600">
                      Maximum connections reached (2/2)
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      Disconnect an account to add a different one
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Collection Settings</CardTitle>
              <CardDescription>
                Configure how your collection is displayed to visitors
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="displayName" className="text-sm font-medium">
                  Display Name
                </label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) =>
                    setFormData({ ...formData, displayName: e.target.value })
                  }
                  placeholder="Your name or collection name"
                />
                <p className="text-xs text-neutral-500">
                  This will be shown at the top of your collection page
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="bio" className="text-sm font-medium">
                  Bio / Description
                </label>
                <Input
                  id="bio"
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  placeholder="Tell visitors about your collection..."
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="publicSlug" className="text-sm font-medium">
                  Public URL Slug
                </label>
                <Input
                  id="publicSlug"
                  value={formData.publicSlug}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      publicSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
                    })
                  }
                  placeholder="your-collection-name"
                />
                <p className="text-xs text-neutral-500">
                  Your collection will be accessible at: /c/{formData.publicSlug || 'your-slug'}
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="defaultSort" className="text-sm font-medium">
                  Default Sort Order
                </label>
                <Select
                  value={formData.defaultSort}
                  onValueChange={(value) =>
                    setFormData({ ...formData, defaultSort: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="artist">Artist (A-Z)</SelectItem>
                    <SelectItem value="artist-desc">Artist (Z-A)</SelectItem>
                    <SelectItem value="year">Year (Newest)</SelectItem>
                    <SelectItem value="year-asc">Year (Oldest)</SelectItem>
                    <SelectItem value="title">Title (A-Z)</SelectItem>
                    <SelectItem value="added">Recently Added</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="itemsPerPage" className="text-sm font-medium">
                  Items Per Page
                </label>
                <Select
                  value={formData.itemsPerPage}
                  onValueChange={(value) =>
                    setFormData({ ...formData, itemsPerPage: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="isPublic" className="text-sm font-medium">
                  Collection Visibility
                </label>
                <Select
                  value={formData.isPublic}
                  onValueChange={(value) =>
                    setFormData({ ...formData, isPublic: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Public (Anyone can view)</SelectItem>
                    <SelectItem value="false">Private (Only you)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Public Album Count Display
                </label>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium">
                      Show both total and public album counts to visitors
                    </div>
                    <div className="text-xs text-neutral-500">
                      When off, shows only public count (&quot;105 records&quot;). When on, shows &quot;109 albums, 105 public&quot;
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={formData.albumCountDisplay === 'TOTAL_AND_PUBLIC'}
                    onClick={() =>
                      setFormData({
                        ...formData,
                        albumCountDisplay:
                          formData.albumCountDisplay === 'TOTAL_AND_PUBLIC'
                            ? 'PUBLIC_ONLY'
                            : 'TOTAL_AND_PUBLIC',
                      })
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 ${
                      formData.albumCountDisplay === 'TOTAL_AND_PUBLIC'
                        ? 'bg-neutral-900'
                        : 'bg-neutral-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.albumCountDisplay === 'TOTAL_AND_PUBLIC'
                          ? 'translate-x-6'
                          : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {message && (
                <div
                  className={`rounded-lg p-3 text-sm ${
                    message.includes('success')
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {message}
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Saving...' : 'Save Settings'}
                </Button>
                <Link href="/dashboard" className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    Cancel
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
