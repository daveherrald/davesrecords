'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSession } from 'next-auth/react';
import AlbumDetail from '@/components/collection/AlbumDetail';
import type { Album } from '@/types/discogs';

interface Stack {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: string;
  isPublic: boolean;
  defaultSort: string;
  qrCodeUrl: string | null;
  curators: Array<{
    id: string;
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

interface StackRecord {
  id: string;
  releaseId: string;
  instanceId: string;
  notes: string | null;
  addedAt: string;
  userId: string;
  user: {
    id: string;
    displayName: string | null;
  };
}

interface EnrichedRecord extends StackRecord {
  album?: Album;
}

export default function StackManagePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const stackId = params.stackId as string;

  const [stack, setStack] = useState<Stack | null>(null);
  const [records, setRecords] = useState<EnrichedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [removing, setRemoving] = useState<Set<string>>(new Set());
  const [editingNotes, setEditingNotes] = useState<Set<string>>(new Set());
  const [notesValues, setNotesValues] = useState<Record<string, string>>({});
  const [selectedAlbum, setSelectedAlbum] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState('artist');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>(25);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    type: '',
    isPublic: 'true',
    defaultSort: '',
  });

  useEffect(() => {
    fetchStack();
    fetchRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stackId]);

  const fetchStack = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/stack/${stackId}`);
      if (response.ok) {
        const data = await response.json();
        setStack(data.stack);
        setFormData({
          name: data.stack.name,
          slug: data.stack.slug,
          description: data.stack.description || '',
          type: data.stack.type,
          isPublic: data.stack.isPublic ? 'true' : 'false',
          defaultSort: data.stack.defaultSort,
        });
      } else {
        router.push('/dashboard/stacks');
      }
    } catch (error) {
      console.error('Failed to fetch stack:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/stack/${stackId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          isPublic: formData.isPublic === 'true',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setStack(data.stack);
        setEditing(false);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update stack');
      }
    } catch (error) {
      alert('Failed to update stack');
    } finally {
      setSaving(false);
    }
  };

  const fetchRecords = async () => {
    try {
      setLoadingRecords(true);
      const response = await fetch(`/api/stack/${stackId}/records`);
      if (response.ok) {
        const data = await response.json();
        const recordsData = data.records;

        // Fetch album details for each record
        const enrichedRecords = await Promise.all(
          recordsData.map(async (record: StackRecord) => {
            try {
              const albumResponse = await fetch(`/api/release/${record.releaseId}`);
              if (albumResponse.ok) {
                const albumData = await albumResponse.json();
                return {
                  ...record,
                  album: albumData,
                };
              }
            } catch (err) {
              console.error(`Failed to fetch album ${record.releaseId}:`, err);
            }
            return record;
          })
        );

        setRecords(enrichedRecords);

        // Initialize notes values
        const notesMap: Record<string, string> = {};
        enrichedRecords.forEach((record) => {
          notesMap[record.instanceId] = record.notes || '';
        });
        setNotesValues(notesMap);
      }
    } catch (error) {
      console.error('Failed to fetch stack records:', error);
    } finally {
      setLoadingRecords(false);
    }
  };

  const handleRemoveRecord = async (instanceId: string) => {
    setRemoving((prev) => new Set(prev).add(instanceId));

    try {
      const response = await fetch(
        `/api/stack/${stackId}/records?instanceId=${instanceId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        setRecords((prev) => prev.filter((r) => r.instanceId !== instanceId));
        // Update count
        if (stack) {
          setStack({
            ...stack,
            _count: { records: stack._count.records - 1 },
          });
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to remove record');
      }
    } catch (error) {
      alert('Failed to remove record');
    } finally {
      setRemoving((prev) => {
        const next = new Set(prev);
        next.delete(instanceId);
        return next;
      });
    }
  };

  const handleEditNotes = (instanceId: string) => {
    setEditingNotes((prev) => new Set(prev).add(instanceId));
  };

  const handleSaveNotes = async (instanceId: string, releaseId: string) => {
    try {
      const response = await fetch(`/api/stack/${stackId}/records`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instanceId,
          releaseId,
          notes: notesValues[instanceId],
        }),
      });

      if (response.ok) {
        setRecords((prev) =>
          prev.map((r) =>
            r.instanceId === instanceId
              ? { ...r, notes: notesValues[instanceId] }
              : r
          )
        );
        setEditingNotes((prev) => {
          const next = new Set(prev);
          next.delete(instanceId);
          return next;
        });
      } else {
        alert('Failed to save notes');
      }
    } catch (error) {
      alert('Failed to save notes');
    }
  };

  const handleCancelEditNotes = (instanceId: string, originalNotes: string | null) => {
    setNotesValues((prev) => ({
      ...prev,
      [instanceId]: originalNotes || '',
    }));
    setEditingNotes((prev) => {
      const next = new Set(prev);
      next.delete(instanceId);
      return next;
    });
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${stack?.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/stack/${stackId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/dashboard/stacks');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete stack');
      }
    } catch (error) {
      alert('Failed to delete stack');
    }
  };

  const userRole = stack?.curators.find((c) => c.role === 'OWNER')?.role || 'CURATOR';
  const isOwner = userRole === 'OWNER';

  // Sort records
  const sortedRecords = [...records].sort((a, b) => {
    if (!a.album || !b.album) return 0;

    switch (sortBy) {
      case 'artist':
        return a.album.artist.localeCompare(b.album.artist);
      case 'artist-desc':
        return b.album.artist.localeCompare(a.album.artist);
      case 'year':
        return b.album.year - a.album.year;
      case 'year-asc':
        return a.album.year - b.album.year;
      case 'title':
        return a.album.title.localeCompare(b.album.title);
      case 'added':
        return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
      default:
        return 0;
    }
  });

  // Pagination
  const totalRecords = sortedRecords.length;
  const totalPages = itemsPerPage === 'all' ? 1 : Math.ceil(totalRecords / itemsPerPage);
  const startIndex = itemsPerPage === 'all' ? 0 : (currentPage - 1) * itemsPerPage;
  const endIndex = itemsPerPage === 'all' ? totalRecords : startIndex + itemsPerPage;
  const paginatedRecords = sortedRecords.slice(startIndex, endIndex);

  // Reset to page 1 when changing items per page
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(value === 'all' ? 'all' : parseInt(value));
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 p-4">
        <div className="mx-auto max-w-4xl py-8">
          <div className="flex items-center justify-center gap-2 text-neutral-400 mb-6">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p>Loading stack...</p>
          </div>
          <div className="space-y-4">
            <div className="h-40 bg-neutral-800 rounded-lg animate-pulse" />
            <div className="h-96 bg-neutral-800 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!stack) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 p-4">
        <div className="mx-auto max-w-4xl py-8">
          <p className="text-white">Stack not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 p-4">
      <div className="mx-auto max-w-4xl space-y-6 py-8">
        {/* Header */}
        <div>
          <Link href="/dashboard/stacks">
            <Button variant="ghost" className="text-neutral-300 hover:text-white mb-2">
              ← Back to Stacks
            </Button>
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white">{stack.name}</h1>
              <p className="text-neutral-300 mt-2">
                {stack._count.records} records • {stack.curators.length} curator
                {stack.curators.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex gap-2">
              <Link href={`/s/${stack.slug}`} target="_blank">
                <Button variant="outline">
                  View Public Page
                </Button>
              </Link>
              <Link href={`/dashboard/stacks/${stackId}/qr`}>
                <Button variant="outline">
                  QR Code
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Settings Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Stack Settings</CardTitle>
                <CardDescription>Manage your stack configuration</CardDescription>
              </div>
              {!editing && (
                <Button onClick={() => setEditing(true)} variant="outline">
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {editing ? (
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">URL Slug</label>
                  <Input
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        slug: e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, '-')
                          .replace(/^-|-$/g, ''),
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Type</label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
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

                <div className="flex gap-2">
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditing(false);
                      setFormData({
                        name: stack.name,
                        slug: stack.slug,
                        description: stack.description || '',
                        type: stack.type,
                        isPublic: stack.isPublic ? 'true' : 'false',
                        defaultSort: stack.defaultSort,
                      });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-neutral-400">Public URL:</span>{' '}
                  <span className="text-white">/s/{stack.slug}</span>
                </div>
                <div>
                  <span className="text-neutral-400">Type:</span>{' '}
                  <span className="text-white">{stack.type}</span>
                </div>
                <div>
                  <span className="text-neutral-400">Visibility:</span>{' '}
                  <span className="text-white">{stack.isPublic ? 'Public' : 'Private'}</span>
                </div>
                <div>
                  <span className="text-neutral-400">Default Sort:</span>{' '}
                  <span className="text-white">{stack.defaultSort}</span>
                </div>
                {stack.description && (
                  <div>
                    <span className="text-neutral-400">Description:</span>{' '}
                    <span className="text-white">{stack.description}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Records Card */}
        <Card>
          <CardHeader>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Records</CardTitle>
                  <CardDescription>
                    Albums in this stack ({stack._count.records})
                  </CardDescription>
                </div>
                <Link href={`/dashboard/stacks/${stackId}/add-records`}>
                  <Button>Add Records</Button>
                </Link>
              </div>
              <div className="flex items-center gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sort by..." />
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
                <div className="flex gap-1 border border-neutral-700 rounded-lg p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="h-7 px-2"
                  >
                    Grid
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="h-7 px-2"
                  >
                    List
                  </Button>
                </div>
                <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 per page</SelectItem>
                    <SelectItem value="25">25 per page</SelectItem>
                    <SelectItem value="50">50 per page</SelectItem>
                    <SelectItem value="100">100 per page</SelectItem>
                    <SelectItem value="all">All</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingRecords ? (
              <div className="text-center py-12 text-neutral-400">
                <div className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p>Loading records from Discogs...</p>
                </div>
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-8 text-neutral-400">
                <p>No records in this stack yet.</p>
                <p className="text-sm mt-2">Click &quot;Add Records&quot; to get started.</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {paginatedRecords.map((record) => {
                  const isRemoving = removing.has(record.instanceId);
                  const canRemove = session?.user?.id === record.userId || isOwner;
                  const isEditingNote = editingNotes.has(record.instanceId);

                  return (
                    <div key={record.id} className="group relative">
                      <div
                        className="aspect-square relative bg-neutral-800 rounded-lg overflow-hidden cursor-pointer"
                        onClick={() => record.album && setSelectedAlbum(record.album.id)}
                      >
                        {record.album ? (
                          <>
                            <Image
                              src={record.album.thumbnail || record.album.coverImage || '/placeholder-album.png'}
                              alt={`${record.album.artist} - ${record.album.title}`}
                              fill
                              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="absolute bottom-0 left-0 right-0 p-2">
                                <p className="text-xs font-semibold text-white line-clamp-1">
                                  {record.album.artist}
                                </p>
                                <p className="text-xs text-neutral-200 line-clamp-1">
                                  {record.album.title}
                                </p>
                                <p className="text-xs text-neutral-300">
                                  {record.album.year}
                                </p>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center justify-center h-full text-neutral-600">
                            <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                          </div>
                        )}
                      </div>
                      {canRemove && (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveRecord(record.instanceId);
                          }}
                          disabled={isRemoving}
                        >
                          ×
                        </Button>
                      )}
                      {record.notes && !isEditingNote && (
                        <div className="mt-1 p-1 text-xs text-neutral-400 line-clamp-2">
                          {record.notes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-1">
                {paginatedRecords.map((record) => {
                  const isRemoving = removing.has(record.instanceId);
                  const canRemove = session?.user?.id === record.userId || isOwner;
                  const isEditingNote = editingNotes.has(record.instanceId);

                  return (
                    <div
                      key={record.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-neutral-800/50 hover:bg-neutral-800/70 transition-colors"
                    >
                      {record.album && (
                        <div
                          className="w-12 h-12 relative flex-shrink-0 rounded overflow-hidden cursor-pointer"
                          onClick={() => setSelectedAlbum(record.album!.id)}
                        >
                          <Image
                            src={record.album.thumbnail || record.album.coverImage || '/placeholder-album.png'}
                            alt={`${record.album.artist} - ${record.album.title}`}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        {record.album ? (
                          <div className="flex items-baseline gap-2">
                            <p className="text-white text-sm font-medium truncate">
                              {record.album.artist}
                            </p>
                            <p className="text-neutral-400 text-sm truncate">
                              {record.album.title}
                            </p>
                            <p className="text-neutral-500 text-xs flex-shrink-0">
                              {record.album.year}
                            </p>
                          </div>
                        ) : (
                          <p className="text-white text-sm">Release ID: {record.releaseId}</p>
                        )}
                        {isEditingNote ? (
                          <div className="mt-1 flex gap-1 items-center">
                            <Input
                              value={notesValues[record.instanceId] || ''}
                              onChange={(e) =>
                                setNotesValues((prev) => ({
                                  ...prev,
                                  [record.instanceId]: e.target.value,
                                }))
                              }
                              placeholder="Add notes..."
                              className="text-xs h-7"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleSaveNotes(record.instanceId, record.releaseId)}
                              className="h-7 px-2 text-xs"
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancelEditNotes(record.instanceId, record.notes)}
                              className="h-7 px-2 text-xs"
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : record.notes ? (
                          <p className="text-xs text-neutral-400 truncate">{record.notes}</p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-1">
                        {!isEditingNote && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs h-7 px-2 text-neutral-400 hover:text-white"
                            onClick={() => handleEditNotes(record.instanceId)}
                          >
                            Note
                          </Button>
                        )}
                        {canRemove && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveRecord(record.instanceId)}
                            disabled={isRemoving}
                            className="text-xs h-7 px-2 text-red-400 hover:text-red-300"
                          >
                            {isRemoving ? '...' : 'Remove'}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-700">
                <div className="text-sm text-neutral-400">
                  Showing {startIndex + 1}-{Math.min(endIndex, totalRecords)} of {totalRecords}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-8 px-3"
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          size="sm"
                          variant={currentPage === pageNum ? 'default' : 'outline'}
                          onClick={() => setCurrentPage(pageNum)}
                          className="h-8 w-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="h-8 px-3"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Album Detail Modal */}
        {selectedAlbum && (
          <AlbumDetail
            albumId={selectedAlbum}
            onClose={() => setSelectedAlbum(null)}
          />
        )}

        {/* Curators Card */}
        <Card>
          <CardHeader>
            <CardTitle>Curators</CardTitle>
            <CardDescription>People who can manage this stack</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stack.curators.map((curator) => (
                <div
                  key={curator.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-neutral-800/50"
                >
                  <div>
                    <p className="font-medium text-white">
                      {curator.user.displayName || curator.user.email}
                    </p>
                    <p className="text-xs text-neutral-400">{curator.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        {isOwner && (
          <Card className="border-red-900/50">
            <CardHeader>
              <CardTitle className="text-red-400">Danger Zone</CardTitle>
              <CardDescription>Irreversible and destructive actions</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={handleDelete}>
                Delete Stack
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
