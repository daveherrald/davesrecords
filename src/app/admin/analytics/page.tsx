'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface AnalyticsData {
  users: {
    total: number;
    active: number;
    banned: number;
    admins: number;
    withDiscogs: number;
    new30Days: number;
  };
  collections: {
    public: number;
    private: number;
    total: number;
  };
  activity30Days: {
    signups: number;
    logins: number;
    pageViews: number;
    collectionViews: number;
  };
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/analytics', {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch analytics');
        }

        const data = await response.json();
        setAnalytics(data);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64 bg-neutral-700" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32 bg-neutral-700" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <Card className="bg-red-500/10 border-red-500/50">
        <CardContent className="pt-6">
          <p className="text-red-400">{error || 'Failed to load analytics'}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Analytics</h1>
        <p className="mt-2 text-neutral-400">Detailed system metrics and statistics</p>
      </div>

      {/* User Statistics */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">User Statistics</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-neutral-800/50 border-neutral-700">
            <CardHeader className="pb-3">
              <CardDescription className="text-neutral-400">Total Users</CardDescription>
              <CardTitle className="text-4xl text-white">{analytics.users.total}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-neutral-400">All registered accounts</div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-800/50 border-neutral-700">
            <CardHeader className="pb-3">
              <CardDescription className="text-neutral-400">Active Users</CardDescription>
              <CardTitle className="text-4xl text-green-400">{analytics.users.active}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-neutral-400">
                {((analytics.users.active / analytics.users.total) * 100).toFixed(1)}% of total
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-800/50 border-neutral-700">
            <CardHeader className="pb-3">
              <CardDescription className="text-neutral-400">Banned Users</CardDescription>
              <CardTitle className="text-4xl text-red-400">{analytics.users.banned}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-neutral-400">
                {((analytics.users.banned / analytics.users.total) * 100).toFixed(1)}% of total
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-800/50 border-neutral-700">
            <CardHeader className="pb-3">
              <CardDescription className="text-neutral-400">Admin Users</CardDescription>
              <CardTitle className="text-4xl text-blue-400">{analytics.users.admins}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-neutral-400">
                {((analytics.users.admins / analytics.users.total) * 100).toFixed(1)}% of total
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-800/50 border-neutral-700">
            <CardHeader className="pb-3">
              <CardDescription className="text-neutral-400">Discogs Connected</CardDescription>
              <CardTitle className="text-4xl text-white">{analytics.users.withDiscogs}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-neutral-400">
                {((analytics.users.withDiscogs / analytics.users.total) * 100).toFixed(1)}% connected
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-800/50 border-neutral-700">
            <CardHeader className="pb-3">
              <CardDescription className="text-neutral-400">New Users (30d)</CardDescription>
              <CardTitle className="text-4xl text-white">{analytics.users.new30Days}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-neutral-400">Recent signups</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Collection Statistics */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Collection Statistics</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="bg-neutral-800/50 border-neutral-700">
            <CardHeader className="pb-3">
              <CardDescription className="text-neutral-400">Total Collections</CardDescription>
              <CardTitle className="text-4xl text-white">{analytics.collections.total}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-neutral-400">Users with connected Discogs</div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-800/50 border-neutral-700">
            <CardHeader className="pb-3">
              <CardDescription className="text-neutral-400">Public Collections</CardDescription>
              <CardTitle className="text-4xl text-green-400">{analytics.collections.public}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-neutral-400">
                {analytics.collections.total > 0
                  ? ((analytics.collections.public / analytics.collections.total) * 100).toFixed(1)
                  : 0}
                % visible
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-800/50 border-neutral-700">
            <CardHeader className="pb-3">
              <CardDescription className="text-neutral-400">Private Collections</CardDescription>
              <CardTitle className="text-4xl text-neutral-400">{analytics.collections.private}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-neutral-400">
                {analytics.collections.total > 0
                  ? ((analytics.collections.private / analytics.collections.total) * 100).toFixed(1)
                  : 0}
                % private
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Activity Statistics (30 days) */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Activity (Last 30 Days)</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-neutral-800/50 border-neutral-700">
            <CardHeader className="pb-3">
              <CardDescription className="text-neutral-400">Signups</CardDescription>
              <CardTitle className="text-4xl text-white">{analytics.activity30Days.signups}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-neutral-400">New user registrations</div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-800/50 border-neutral-700">
            <CardHeader className="pb-3">
              <CardDescription className="text-neutral-400">Logins</CardDescription>
              <CardTitle className="text-4xl text-white">{analytics.activity30Days.logins}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-neutral-400">User authentication events</div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-800/50 border-neutral-700">
            <CardHeader className="pb-3">
              <CardDescription className="text-neutral-400">Page Views</CardDescription>
              <CardTitle className="text-4xl text-white">{analytics.activity30Days.pageViews}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-neutral-400">Total page impressions</div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-800/50 border-neutral-700">
            <CardHeader className="pb-3">
              <CardDescription className="text-neutral-400">Collection Views</CardDescription>
              <CardTitle className="text-4xl text-white">{analytics.activity30Days.collectionViews}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-neutral-400">Collections browsed</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Conversion Metrics */}
      <Card className="bg-neutral-800/50 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-white">Conversion Metrics</CardTitle>
          <CardDescription className="text-neutral-400">Key performance indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <div className="text-sm text-neutral-400 mb-2">Discogs Connection Rate</div>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-white">
                  {((analytics.users.withDiscogs / analytics.users.total) * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-neutral-400">
                  ({analytics.users.withDiscogs} / {analytics.users.total})
                </div>
              </div>
            </div>
            <div>
              <div className="text-sm text-neutral-400 mb-2">Public Collection Rate</div>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-white">
                  {analytics.collections.total > 0
                    ? ((analytics.collections.public / analytics.collections.total) * 100).toFixed(1)
                    : 0}
                  %
                </div>
                <div className="text-sm text-neutral-400">
                  ({analytics.collections.public} / {analytics.collections.total})
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
