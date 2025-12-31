'use client';

interface ControlsFABProps {
  onClick: () => void;
  activeFiltersCount?: number;
}

export default function ControlsFAB({ onClick, activeFiltersCount = 0 }: ControlsFABProps) {
  return (
    <button
      onClick={onClick}
      aria-label="Open filters and search"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-800/90 backdrop-blur-sm border border-neutral-700 shadow-xl transition-all duration-300 hover:bg-neutral-700 hover:scale-105 active:scale-95"
    >
      {/* Filter/Settings Icon */}
      <svg
        className="h-6 w-6 text-neutral-300"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
        />
      </svg>

      {/* Active Filters Badge */}
      {activeFiltersCount > 0 && (
        <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
          {activeFiltersCount}
        </div>
      )}
    </button>
  );
}
