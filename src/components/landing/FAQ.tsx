'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function FAQ() {
  const faqs = [
    {
      question: 'Is Dave\'s Records free to use?',
      answer:
        'Yes! Dave\'s Records is completely free. Connect your Discogs account and start sharing your collection today.',
    },
    {
      question: 'Is my collection data private?',
      answer:
        'You control your privacy. Collections are public by default (so visitors can scan and view), but you can make yours private in settings. Your OAuth tokens are encrypted and stored securely.',
    },
    {
      question: 'Do I need a Discogs account?',
      answer:
        'Yes, Dave\'s Records pulls your collection data from Discogs. If you don\'t have a Discogs account, you can create one for free at discogs.com.',
    },
    {
      question: 'Can I customize how my collection looks?',
      answer:
        'Your collection is automatically displayed with beautiful album artwork in a responsive grid. You can sort and filter, and visitors can search your collection.',
    },
    {
      question: 'How do I share my collection?',
      answer:
        'After connecting, you\'ll get a unique URL (like davesrecords.com/c/your-name) and a QR code. Share the link or display the QR code for visitors to scan.',
    },
  ];

  return (
    <section className="w-full max-w-3xl mx-auto">
      <div className="text-center space-y-4 mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold text-white">
          Frequently Asked Questions
        </h2>
        <p className="text-lg text-neutral-300">
          Everything you need to know about Dave's Records
        </p>
      </div>

      <Accordion type="single" collapsible className="space-y-4">
        {faqs.map((faq, index) => (
          <AccordionItem
            key={index}
            value={`item-${index}`}
            className="border border-neutral-700 rounded-lg px-6 bg-neutral-800/50"
          >
            <AccordionTrigger className="text-left text-white hover:text-neutral-300">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-neutral-400">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
