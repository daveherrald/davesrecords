'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Stack {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: string;
  isPublic: boolean;
  defaultSort: string;
  createdAt: string;
  curators: Array<{
    role: string;
    user: {
      id: string;
      displayName: string | null;
      email: string | null;
    };
  }>;
  _count: {
    records: number;
  };
}

export default function StacksPage() {
  const router = useRouter();
  const [stacks, setStacks] = useState<Stack[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    type: 'PERSONAL',
    isPublic: 'true',
    defaultSort: 'artist',
  });

  useEffect(() => {
    fetchStacks();
  }, []);

  const fetchStacks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/stack');
      if (response.ok) {
        const data = await response.json();
        setStacks(data.stacks);
      }
    } catch (error) {
      console.error('Failed to fetch stacks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const response = await fetch('/api/stack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          isPublic: formData.isPublic === 'true',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setStacks([data.stack, ...stacks]);
        setShowCreateForm(false);
        setFormData({
          name: '',
          slug: '',
          description: '',
          type: 'PERSONAL',
          isPublic: 'true',
          defaultSort: 'artist',
        });
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create stack');
      }
    } catch (error) {
      alert('Failed to create stack');
    } finally {
      setCreating(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 p-4">
        <div className="mx-auto max-w-4xl py-8">
          <p className="text-white">Loading stacks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 p-4">
      <div className="mx-auto max-w-4xl space-y-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/dashboard">
              <Button variant="ghost" className="text-neutral-300 hover:text-white mb-2">
                ← Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-4xl font-bold text-white">Your Stacks</h1>
            <p className="text-neutral-300 mt-2">
              Physical record collections in different listening areas
            </p>
          </div>
          {!showCreateForm && (
            <Button onClick={() => setShowCreateForm(true)}>
              Create Stack
            </Button>
          )}
        </div>

        {/* Create Stack Form */}
        {showCreateForm && (
          <Card>
            <CardHeader>
              <CardTitle>Create New Stack</CardTitle>
              <CardDescription>
                A stack represents physical records at a specific location
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setFormData({
                        ...formData,
                        name,
                        slug: generateSlug(name),
                      });
                    }}
                    placeholder="Upstairs Listening Room"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">URL Slug *</label>
                  <Input
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: generateSlug(e.target.value) })
                    }
                    placeholder="upstairs-listening-room"
                    required
                  />
                  <p className="text-xs text-neutral-500">
                    Your stack will be at: /s/{formData.slug || 'your-slug'}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="My main listening space"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Type</label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) =>
                        setFormData({ ...formData, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERSONAL">Personal</SelectItem>
                        <SelectItem value="COMMERCIAL">Commercial</SelectItem>
                        <SelectItem value="INSTITUTIONAL">Institutional</SelectItem>
                        <SelectItem value="PUBLIC">Public</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Visibility</label>
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
                        <SelectItem value="true">Public</SelectItem>
                        <SelectItem value="false">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Default Sort</label>
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

                <div className="flex gap-2">
                  <Button type="submit" disabled={creating}>
                    {creating ? 'Creating...' : 'Create Stack'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Stacks List */}
        {stacks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-neutral-400 mb-4">
                No stacks yet. Create your first stack to get started!
              </p>
              {!showCreateForm && (
                <Button onClick={() => setShowCreateForm(true)}>
                  Create Your First Stack
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {stacks.map((stack) => {
              const userRole = stack.curators.find((c) => c.role === 'OWNER')?.role || 'CURATOR';

              return (
                <Card key={stack.id} className="hover:border-neutral-600 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {stack.name}
                          {!stack.isPublic && (
                            <span className="text-xs bg-neutral-700 text-neutral-300 px-2 py-1 rounded">
                              Private
                            </span>
                          )}
                        </CardTitle>
                        <CardDescription>
                          {stack.description || 'No description'}
                        </CardDescription>
                      </div>
                      <Link href={`/dashboard/stacks/${stack.id}`}>
                        <Button variant="outline" size="sm">
                          Manage
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6 text-sm text-neutral-400">
                      <div>
                        <span className="font-medium text-white">{stack._count.records}</span> records
                      </div>
                      <div>
                        <span className="font-medium text-white">{stack.curators.length}</span> curator{stack.curators.length !== 1 ? 's' : ''}
                      </div>
                      <div className="text-xs">
                        /s/{stack.slug}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
