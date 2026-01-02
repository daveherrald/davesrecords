'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Header } from '@/components/Header';

interface ViewStats {
  totalViews: number;
  uniqueVisitors: number;
  recentViewsCount: number;
  recentViews: Array<{
    id: string;
    viewerIp: string | null;
    viewerAgent: string | null;
    referer: string | null;
    viewedAt: string;
  }>;
  viewsByDay: Array<{
    date: string;
    count: number;
  }>;
}

export default function StatsPage() {
  const [stats, setStats] = useState<ViewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/stats', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
        <Header />
        <div className="mx-auto max-w-6xl space-y-8 py-8 px-4">
          <Skeleton className="h-12 w-64 bg-neutral-700" />
          <div className="grid gap-6 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 bg-neutral-700" />
            ))}
          </div>
          <Skeleton className="h-96 bg-neutral-700" />
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
        <Header />
        <div className="mx-auto max-w-6xl py-8 px-4">
          <Card className="bg-red-500/10 border-red-500/50">
            <CardContent className="pt-6">
              <p className="text-red-400">{error || 'Failed to load stats'}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
      <Header />
      <div className="mx-auto max-w-6xl space-y-8 py-8 px-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white">Collection Statistics</h1>
          <p className="mt-2 text-lg text-neutral-300">Track how many people are viewing your collection</p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="bg-neutral-800/50 border-neutral-700">
            <CardHeader className="pb-3">
              <CardDescription className="text-neutral-400">Total Views</CardDescription>
              <CardTitle className="text-4xl text-white">{stats.totalViews.toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-neutral-400">All time</div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-800/50 border-neutral-700">
            <CardHeader className="pb-3">
              <CardDescription className="text-neutral-400">Unique Visitors</CardDescription>
              <CardTitle className="text-4xl text-green-400">{stats.uniqueVisitors.toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-neutral-400">Distinct IP addresses</div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-800/50 border-neutral-700">
            <CardHeader className="pb-3">
              <CardDescription className="text-neutral-400">Last 30 Days</CardDescription>
              <CardTitle className="text-4xl text-blue-400">{stats.recentViewsCount.toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-neutral-400">Recent activity</div>
            </CardContent>
          </Card>
        </div>

        {/* Views by Day */}
        {stats.viewsByDay.length > 0 && (
          <Card className="bg-neutral-800/50 border-neutral-700">
            <CardHeader>
              <CardTitle className="text-white">Views by Day (Last 30 Days)</CardTitle>
              <CardDescription className="text-neutral-400">Daily breakdown of collection views</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.viewsByDay.map((day) => (
                  <div key={day.date} className="flex items-center justify-between py-2 border-b border-neutral-700">
                    <span className="text-neutral-300">{new Date(day.date).toLocaleDateString()}</span>
                    <span className="text-white font-semibold">{day.count} views</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Views */}
        <Card className="bg-neutral-800/50 border-neutral-700">
          <CardHeader>
            <CardTitle className="text-white">Recent Views</CardTitle>
            <CardDescription className="text-neutral-400">Last 50 collection views</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentViews.length === 0 ? (
              <p className="text-center text-neutral-400 py-8">No views yet</p>
            ) : (
              <div className="space-y-3">
                {stats.recentViews.map((view) => (
                  <div key={view.id} className="rounded-lg bg-neutral-900/50 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">
                        {view.viewerIp || 'Unknown IP'}
                      </span>
                      <span className="text-sm text-neutral-400">
                        {new Date(view.viewedAt).toLocaleString()}
                      </span>
                    </div>
                    {view.viewerAgent && (
                      <div className="text-xs text-neutral-500">
                        <strong>User Agent:</strong> {view.viewerAgent}
                      </div>
                    )}
                    {view.referer && (
                      <div className="text-xs text-neutral-500">
                        <strong>Referer:</strong> {view.referer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
