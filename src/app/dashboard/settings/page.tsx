'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    publicSlug: '',
    defaultSort: 'artist',
    itemsPerPage: '50',
    isPublic: 'true',
  });

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
