/**
 * User Stats API
 * GET /api/user/stats - Get collection view statistics for authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get total view count
    const totalViews = await prisma.collectionView.count({
      where: { userId },
    });

    // Get unique visitor count (by IP)
    const uniqueVisitors = await prisma.collectionView.findMany({
      where: { userId },
      select: { viewerIp: true },
      distinct: ['viewerIp'],
    });

    // Get views in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentViewsCount = await prisma.collectionView.count({
      where: {
        userId,
        viewedAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Get recent view details (last 50)
    const recentViews = await prisma.collectionView.findMany({
      where: { userId },
      orderBy: { viewedAt: 'desc' },
      take: 50,
      select: {
        id: true,
        viewerIp: true,
        viewerAgent: true,
        referer: true,
        viewedAt: true,
      },
    });

    // Get all views in last 30 days for grouping by day
    const last30DaysViews = await prisma.collectionView.findMany({
      where: {
        userId,
        viewedAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        viewedAt: true,
      },
      orderBy: {
        viewedAt: 'desc',
      },
    });

    // Group views by day
    const viewsByDayMap = new Map<string, number>();
    last30DaysViews.forEach(view => {
      const dateStr = view.viewedAt.toISOString().split('T')[0];
      viewsByDayMap.set(dateStr, (viewsByDayMap.get(dateStr) || 0) + 1);
    });

    const viewsByDay = Array.from(viewsByDayMap.entries()).map(([date, count]) => ({
      date,
      count,
    })).sort((a, b) => b.date.localeCompare(a.date));

    return NextResponse.json({
      totalViews,
      uniqueVisitors: uniqueVisitors.length,
      recentViewsCount,
      recentViews,
      viewsByDay,
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
