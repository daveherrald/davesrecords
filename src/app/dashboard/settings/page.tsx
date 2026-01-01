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
  });

  // Load user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/user/me');
        if (response.ok) {
          const data = await response.json();
          setUserData(data.user);
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
    };
    fetchUserData();

    // Check for success/error messages from query params
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    if (success === 'DiscogsConnected') {
      setMessage('Discogs account connected successfully!');
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

  const handleDisconnectDiscogs = async () => {
    if (!confirm('Are you sure you want to disconnect your Discogs account? Your collection will no longer be accessible until you reconnect.')) {
      return;
    }

    setDisconnecting(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/discogs/disconnect', {
        method: 'POST',
      });

      if (response.ok) {
        setMessage('Discogs account disconnected successfully!');
        setUserData((prev) => prev ? { ...prev, hasDiscogsConnection: false, discogsUsername: null } : null);
        setTimeout(() => router.push('/dashboard'), 1500);
      } else {
        setMessage('Failed to disconnect Discogs account');
      }
    } catch (error) {
      setMessage('An error occurred while disconnecting');
    } finally {
      setDisconnecting(false);
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

        {/* Discogs Connection Card */}
        <Card>
          <CardHeader>
            <CardTitle>Discogs Connection</CardTitle>
            <CardDescription>
              Connect your Discogs account to display your vinyl collection
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userData?.hasDiscogsConnection ? (
              <div className="space-y-4">
                <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                  <p className="text-sm font-medium text-green-900">
                    ✓ Connected as <strong>{userData.discogsUsername}</strong>
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    Your Discogs collection is being displayed on your public page.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={handleDisconnectDiscogs}
                  disabled={disconnecting}
                  className="w-full"
                >
                  {disconnecting ? 'Disconnecting...' : 'Disconnect Discogs Account'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
                  <p className="text-sm font-medium text-yellow-900">
                    Not connected
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
