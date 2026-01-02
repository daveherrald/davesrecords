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

    // Get views grouped by day for last 30 days
    const viewsByDay = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
      SELECT DATE(viewed_at) as date, COUNT(*) as count
      FROM "CollectionView"
      WHERE user_id = ${userId}
        AND viewed_at >= ${thirtyDaysAgo}
      GROUP BY DATE(viewed_at)
      ORDER BY date DESC
    `;

    return NextResponse.json({
      totalViews,
      uniqueVisitors: uniqueVisitors.length,
      recentViewsCount,
      recentViews,
      viewsByDay: viewsByDay.map(row => ({
        date: row.date,
        count: Number(row.count),
      })),
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
