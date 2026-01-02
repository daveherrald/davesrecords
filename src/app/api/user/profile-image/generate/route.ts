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

    const { gridSize = 3 } = await request.json();
    const totalAlbums = gridSize * gridSize;

    // Fetch user's collection
    const { albums } = await getUserCollection(session.user.id, 1);

    if (albums.length === 0) {
      return NextResponse.json(
        { error: 'No albums in collection' },
        { status: 400 }
      );
    }

    // Select random albums
    const selectedAlbums = albums
      .sort(() => Math.random() - 0.5)
      .slice(0, totalAlbums);

    // Ensure we have enough albums
    while (selectedAlbums.length < totalAlbums) {
      selectedAlbums.push(...albums.slice(0, totalAlbums - selectedAlbums.length));
    }

    // Download album cover images
    const imageSize = 300; // Size of each album cover in the grid
    const imageBuffers = await Promise.all(
      selectedAlbums.map(async (album) => {
        try {
          const imageUrl = album.coverImage || album.thumbnail;
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

    // Create composite image
    const canvasSize = gridSize * imageSize;
    const compositeOperations = imageBuffers.map((buffer, index) => {
      const row = Math.floor(index / gridSize);
      const col = index % gridSize;

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
