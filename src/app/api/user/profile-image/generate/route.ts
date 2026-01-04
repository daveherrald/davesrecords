/**
 * Profile Image Generator API
 * POST /api/user/profile-image/generate - Generate a collage from user's albums
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getUserCollection } from '@/lib/discogs';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { gridSize = 'all' } = await request.json();

    // Fetch user's collection - get all albums by fetching multiple pages if needed
    const allAlbums: Array<{ thumbnail?: string; coverImage?: string }> = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const { albums, pagination } = await getUserCollection(session.user.id, page, 100);
      allAlbums.push(...albums);

      // Check if there are more pages
      hasMore = pagination.page < pagination.pages;
      page++;
    }

    if (allAlbums.length === 0) {
      return NextResponse.json(
        { error: 'No albums in collection' },
        { status: 400 }
      );
    }

    // Calculate grid size and total albums
    let actualGridSize: number;
    let totalAlbums: number;

    if (gridSize === 'all') {
      // Use all albums and calculate optimal square grid
      actualGridSize = Math.ceil(Math.sqrt(allAlbums.length));
      totalAlbums = actualGridSize * actualGridSize;
    } else {
      // Use specified grid size
      actualGridSize = parseInt(gridSize);
      totalAlbums = actualGridSize * actualGridSize;
    }

    // Select random albums
    const selectedAlbums = allAlbums
      .sort(() => Math.random() - 0.5)
      .slice(0, totalAlbums);

    // Ensure we have enough albums by repeating albums to fill the grid
    while (selectedAlbums.length < totalAlbums) {
      selectedAlbums.push(...allAlbums.slice(0, totalAlbums - selectedAlbums.length));
    }

    // Download album cover images
    const imageSize = 300; // Size of each album cover in the grid
    const imageBuffers = await Promise.all(
      selectedAlbums.map(async (album) => {
        try {
          const imageUrl = album.coverImage || album.thumbnail;
          if (!imageUrl) return null;
          const response = await fetch(imageUrl);
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          // Resize image to consistent size
          return await sharp(buffer)
            .resize(imageSize, imageSize, { fit: 'cover' })
            .toBuffer();
        } catch (error) {
          console.error('Error fetching album cover:', error);
          // Return a placeholder gray square
          return await sharp({
            create: {
              width: imageSize,
              height: imageSize,
              channels: 3,
              background: { r: 100, g: 100, b: 100 }
            }
          }).png().toBuffer();
        }
      })
    );

    // Create composite image - filter out null buffers
    const canvasSize = actualGridSize * imageSize;
    const validBuffers = imageBuffers.filter((buffer): buffer is Buffer => buffer !== null);
    const compositeOperations = validBuffers.map((buffer, index) => {
      const row = Math.floor(index / actualGridSize);
      const col = index % actualGridSize;

      return {
        input: buffer,
        top: row * imageSize,
        left: col * imageSize,
      };
    });

    const compositeImage = await sharp({
      create: {
        width: canvasSize,
        height: canvasSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 1 }
      }
    })
      .composite(compositeOperations)
      .png()
      .toBuffer();

    // Return image
    return new NextResponse(new Uint8Array(compositeImage), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'attachment; filename="my-vinyl-collection.png"',
      },
    });
  } catch (error) {
    console.error('Profile image generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate profile image' },
      { status: 500 }
    );
  }
}
