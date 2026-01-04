'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

function DeviceFrame({
  type,
  href,
  children,
}: {
  type: 'desktop' | 'mobile';
  href: string;
  children: React.ReactNode;
}) {
  if (type === 'desktop') {
    return (
      <Link
        href={href}
        className="group relative rounded-xl overflow-hidden border border-neutral-700 bg-neutral-900 shadow-2xl transition-transform hover:scale-[1.02]"
      >
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-4 py-3 bg-neutral-800 border-b border-neutral-700">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-neutral-600" />
            <div className="w-3 h-3 rounded-full bg-neutral-600" />
            <div className="w-3 h-3 rounded-full bg-neutral-600" />
          </div>
          <div className="flex-1 mx-4">
            <div className="bg-neutral-700 rounded-md px-3 py-1 text-xs text-neutral-400 max-w-xs mx-auto truncate">
              davesrecords.com/c/_davesrecords
            </div>
          </div>
        </div>
        {/* Content */}
        <div className="relative w-full max-w-2xl aspect-[16/10]">
          {children}
        </div>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white font-medium bg-black/50 px-4 py-2 rounded-full">
            View live demo
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="group relative rounded-[2.5rem] overflow-hidden border-[6px] border-neutral-700 bg-neutral-900 shadow-2xl transition-transform hover:scale-[1.02]"
    >
      {/* Phone notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-neutral-700 rounded-b-xl z-10" />
      {/* Content */}
      <div className="relative w-48 sm:w-52 aspect-[9/19] pt-6">
        {children}
      </div>
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center rounded-[2rem]">
        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white font-medium bg-black/50 px-4 py-2 rounded-full text-sm">
          View demo
        </span>
      </div>
    </Link>
  );
}

function ScreenshotImage({
  src,
  alt,
  sizes,
  priority,
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
}) {
  const [error, setError] = useState(false);

  if (error) {
    // Fallback: show a gradient placeholder with album grid pattern
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center">
        <div className="grid grid-cols-4 gap-1 p-4 opacity-30">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="w-8 h-8 bg-neutral-600 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover object-top"
      sizes={sizes}
      priority={priority}
      onError={() => setError(true)}
    />
  );
}

export default function ScreenshotGallery() {
  return (
    <section className="w-full max-w-5xl">
      <div className="text-center mb-12">
        <h2 className="text-2xl font-semibold text-white sm:text-3xl">
          See it in action
        </h2>
        <p className="mt-2 text-neutral-400">
          A beautiful grid of album art, searchable and filterable
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
        {/* Desktop Screenshot */}
        <DeviceFrame type="desktop" href="/c/_davesrecords">
          <ScreenshotImage
            src="/screenshots/desktop.jpg"
            alt="Desktop view of a Stack showing album grid"
            sizes="(max-width: 768px) 100vw, 672px"
            priority
          />
        </DeviceFrame>

        {/* Mobile Screenshot */}
        <DeviceFrame type="mobile" href="/c/_davesrecords">
          <ScreenshotImage
            src="/screenshots/mobile.jpg"
            alt="Mobile view of a Stack"
            sizes="224px"
          />
        </DeviceFrame>
      </div>

      <p className="text-center mt-8 text-neutral-500 text-sm">
        Tap to explore the live demo
      </p>
    </section>
  );
}
