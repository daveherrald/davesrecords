'use client';

export default function HowItWorks() {
  const steps = [
    {
      number: '1',
      title: 'Connect Your Discogs Account',
      description:
        "Securely connect your Discogs account using OAuth. We only read your collection data - we never modify anything.",
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
          />
        </svg>
      ),
    },
    {
      number: '2',
      title: 'Generate Your QR Code',
      description:
        'Get a unique URL and QR code for your collection. Download it, print it, or display it digitally.',
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
          />
        </svg>
      ),
    },
    {
      number: '3',
      title: 'Share & Scan',
      description:
        'Visitors scan your QR code and instantly browse your vinyl collection on their phone. Beautiful, fast, and mobile-optimized.',
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      ),
    },
  ];

  return (
    <section className="w-full max-w-6xl mx-auto">
      <div className="text-center space-y-4 mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold text-white">
          How It Works
        </h2>
        <p className="text-lg text-neutral-300 max-w-2xl mx-auto">
          Get started in minutes with these simple steps
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {steps.map((step) => (
          <div
            key={step.number}
            className="relative flex flex-col items-center text-center space-y-4"
          >
            {/* Step Number */}
            <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-neutral-800 border-4 border-neutral-900 flex items-center justify-center">
              <span className="text-xl font-bold text-white">{step.number}</span>
            </div>

            {/* Icon */}
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-neutral-800 text-white mt-4">
              {step.icon}
            </div>

            {/* Content */}
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-white">{step.title}</h3>
              <p className="text-sm text-neutral-400">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
