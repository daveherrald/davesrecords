import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getOverviewStats } from '@/lib/admin/analytics';
import { getAllAdminActions } from '@/lib/admin/audit';

export default async function AdminDashboard() {
  const stats = await getOverviewStats();
  const recentActions = await getAllAdminActions(10);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        <p className="mt-2 text-neutral-400">Overview of system statistics and recent activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-neutral-800/50 border-neutral-700">
          <CardHeader className="pb-3">
            <CardDescription className="text-neutral-400">Total Users</CardDescription>
            <CardTitle className="text-3xl text-white">{stats.users.total}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-neutral-400">
              <span className="text-green-400">{stats.users.active}</span> active •{' '}
              <span className="text-red-400">{stats.users.banned}</span> banned
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-800/50 border-neutral-700">
          <CardHeader className="pb-3">
            <CardDescription className="text-neutral-400">Admins</CardDescription>
            <CardTitle className="text-3xl text-white">{stats.users.admins}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-neutral-400">
              {((stats.users.admins / stats.users.total) * 100).toFixed(1)}% of all users
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-800/50 border-neutral-700">
          <CardHeader className="pb-3">
            <CardDescription className="text-neutral-400">With Discogs</CardDescription>
            <CardTitle className="text-3xl text-white">{stats.users.withDiscogs}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-neutral-400">
              {((stats.users.withDiscogs / stats.users.total) * 100).toFixed(1)}% connected
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-800/50 border-neutral-700">
          <CardHeader className="pb-3">
            <CardDescription className="text-neutral-400">New Users (30d)</CardDescription>
            <CardTitle className="text-3xl text-white">{stats.users.new30Days}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-neutral-400">Recent signups</div>
          </CardContent>
        </Card>
      </div>

      {/* Collections Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-neutral-800/50 border-neutral-700">
          <CardHeader className="pb-3">
            <CardDescription className="text-neutral-400">Total Collections</CardDescription>
            <CardTitle className="text-3xl text-white">{stats.collections.total}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-neutral-400">Users with Discogs connected</div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-800/50 border-neutral-700">
          <CardHeader className="pb-3">
            <CardDescription className="text-neutral-400">Public Collections</CardDescription>
            <CardTitle className="text-3xl text-white">{stats.collections.public}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-neutral-400">
              {stats.collections.total > 0
                ? ((stats.collections.public / stats.collections.total) * 100).toFixed(1)
                : 0}
              % visibility
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-800/50 border-neutral-700">
          <CardHeader className="pb-3">
            <CardDescription className="text-neutral-400">Private Collections</CardDescription>
            <CardTitle className="text-3xl text-white">{stats.collections.private}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-neutral-400">
              {stats.collections.total > 0
                ? ((stats.collections.private / stats.collections.total) * 100).toFixed(1)
                : 0}
              % private
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Stats (30 days) */}
      <Card className="bg-neutral-800/50 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-white">Activity (Last 30 Days)</CardTitle>
          <CardDescription className="text-neutral-400">Recent system activity metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <div className="text-2xl font-bold text-white">{stats.activity30Days.signups}</div>
              <div className="text-sm text-neutral-400">Signups</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{stats.activity30Days.logins}</div>
              <div className="text-sm text-neutral-400">Logins</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{stats.activity30Days.pageViews}</div>
              <div className="text-sm text-neutral-400">Page Views</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{stats.activity30Days.collectionViews}</div>
              <div className="text-sm text-neutral-400">Collection Views</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Admin Actions */}
      <Card className="bg-neutral-800/50 border-neutral-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Recent Admin Actions</CardTitle>
              <CardDescription className="text-neutral-400">Latest administrative activity</CardDescription>
            </div>
            <Link href="/admin/audit" className="text-sm text-blue-400 hover:text-blue-300">
              View all →
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentActions.length > 0 ? (
            <div className="space-y-3">
              {recentActions.map((action) => (
                <div
                  key={action.id}
                  className="flex items-start justify-between border-b border-neutral-700 pb-3 last:border-0"
                >
                  <div className="flex-1">
                    <div className="text-sm text-white">{action.description}</div>
                    <div className="mt-1 text-xs text-neutral-400">
                      by {action.admin.name || action.admin.email} •{' '}
                      {new Date(action.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="ml-4">
                    <span className="rounded-full bg-neutral-700 px-2 py-1 text-xs text-neutral-300">
                      {action.action}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-neutral-400">No admin actions yet</div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-neutral-800/50 border-neutral-700">
          <CardHeader>
            <CardTitle className="text-white">Manage Users</CardTitle>
            <CardDescription className="text-neutral-400">View and manage user accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/admin/users"
              className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Go to Users
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-neutral-800/50 border-neutral-700">
          <CardHeader>
            <CardTitle className="text-white">View Analytics</CardTitle>
            <CardDescription className="text-neutral-400">Detailed system analytics and metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/admin/analytics"
              className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Go to Analytics
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
