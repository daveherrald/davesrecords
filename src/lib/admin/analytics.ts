/**
 * Analytics tracking utilities
 */

import { prisma } from '@/lib/db';
import { AnalyticsEventType } from '@prisma/client';

export interface TrackEventParams {
  eventType: AnalyticsEventType;
  userId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  referer?: string;
}

/**
 * Track an analytics event
 */
export async function trackEvent(params: TrackEventParams): Promise<void> {
  await prisma.analyticsEvent.create({
    data: {
      eventType: params.eventType,
      userId: params.userId,
      metadata: params.metadata,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      referer: params.referer,
    },
  });
}

/**
 * Get event counts by type for a date range
 */
export async function getEventStats(startDate?: Date, endDate?: Date) {
  const where = {
    ...(startDate && endDate && {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    }),
  };

  const counts = await prisma.analyticsEvent.groupBy({
    by: ['eventType'],
    where,
    _count: {
      eventType: true,
    },
  });

  return counts.map((count) => ({
    eventType: count.eventType,
    count: count._count.eventType,
  }));
}

/**
 * Get user activity events
 */
export async function getUserActivity(userId: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return prisma.analyticsEvent.findMany({
    where: {
      userId,
      createdAt: {
        gte: startDate,
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get overview statistics for the dashboard
 */
export async function getOverviewStats() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);

  // User stats
  const totalUsers = await prisma.user.count();
  const activeUsers = await prisma.user.count({
    where: { status: 'ACTIVE' },
  });
  const bannedUsers = await prisma.user.count({
    where: { status: 'BANNED' },
  });
  const adminUsers = await prisma.user.count({
    where: { role: 'ADMIN' },
  });
  const usersWithDiscogs = await prisma.discogsConnection.count();

  // New users in last 30 days
  const newUsers = await prisma.user.count({
    where: {
      createdAt: {
        gte: thirtyDaysAgo,
      },
    },
  });

  // Collection stats
  const totalCollections = await prisma.user.count({
    where: {
      isPublic: true,
      discogsConnection: {
        isNot: null,
      },
    },
  });

  const privateCollections = await prisma.user.count({
    where: {
      isPublic: false,
      discogsConnection: {
        isNot: null,
      },
    },
  });

  // Recent activity (last 30 days)
  const recentSignups = await prisma.analyticsEvent.count({
    where: {
      eventType: 'USER_SIGNUP',
      createdAt: {
        gte: thirtyDaysAgo,
      },
    },
  });

  const recentLogins = await prisma.analyticsEvent.count({
    where: {
      eventType: 'USER_LOGIN',
      createdAt: {
        gte: thirtyDaysAgo,
      },
    },
  });

  const recentPageViews = await prisma.analyticsEvent.count({
    where: {
      eventType: 'PAGE_VIEW',
      createdAt: {
        gte: thirtyDaysAgo,
      },
    },
  });

  const recentCollectionViews = await prisma.analyticsEvent.count({
    where: {
      eventType: 'COLLECTION_VIEW',
      createdAt: {
        gte: thirtyDaysAgo,
      },
    },
  });

  return {
    users: {
      total: totalUsers,
      active: activeUsers,
      banned: bannedUsers,
      admins: adminUsers,
      withDiscogs: usersWithDiscogs,
      new30Days: newUsers,
    },
    collections: {
      public: totalCollections,
      private: privateCollections,
      total: totalCollections + privateCollections,
    },
    activity30Days: {
      signups: recentSignups,
      logins: recentLogins,
      pageViews: recentPageViews,
      collectionViews: recentCollectionViews,
    },
  };
}

/**
 * Get daily event counts for a specific event type
 */
export async function getDailyEventCounts(
  eventType: AnalyticsEventType,
  days: number = 30
) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const events = await prisma.analyticsEvent.findMany({
    where: {
      eventType,
      createdAt: {
        gte: startDate,
      },
    },
    select: {
      createdAt: true,
    },
  });

  // Group by day
  const dailyCounts: Record<string, number> = {};

  events.forEach((event) => {
    const date = event.createdAt.toISOString().split('T')[0];
    dailyCounts[date] = (dailyCounts[date] || 0) + 1;
  });

  return Object.entries(dailyCounts).map(([date, count]) => ({
    date,
    count,
  }));
}

/**
 * Get most active users by event count
 */
export async function getMostActiveUsers(limit: number = 10, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const userEventCounts = await prisma.analyticsEvent.groupBy({
    by: ['userId'],
    where: {
      userId: {
        not: null,
      },
      createdAt: {
        gte: startDate,
      },
    },
    _count: {
      userId: true,
    },
    orderBy: {
      _count: {
        userId: 'desc',
      },
    },
    take: limit,
  });

  // Fetch user details
  const userIds = userEventCounts
    .map((u) => u.userId)
    .filter((id): id is string => id !== null);

  const users = await prisma.user.findMany({
    where: {
      id: {
        in: userIds,
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      publicSlug: true,
    },
  });

  return userEventCounts.map((eventCount) => {
    const user = users.find((u) => u.id === eventCount.userId);
    return {
      user,
      eventCount: eventCount._count.userId,
    };
  });
}
