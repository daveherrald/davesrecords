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
      question: 'What is a Stack?',
      answer:
        'A Stack is your vinyl collection displayed as a beautiful, browsable page. Think of it as a digital view of the records stacked by your turntable - easy to flip through and share with anyone.',
    },
    {
      question: 'Is it free?',
      answer:
        'Yes, completely free. Sign in, connect your Discogs, and your Stack is ready to share.',
    },
    {
      question: 'Do I need a Discogs account?',
      answer:
        'Yes. Your Stack pulls from your Discogs collection. If you don\'t have one, create a free account at discogs.com and add some records.',
    },
    {
      question: 'How do I share my Stack?',
      answer:
        'You get a unique URL (like davesrecords.com/c/your-name) and a downloadable QR code. Share the link online or print the QR code to display by your records.',
    },
  ];

  return (
    <section className="w-full max-w-2xl mx-auto">
      <div className="text-center space-y-2 mb-10">
        <h2 className="text-2xl sm:text-3xl font-semibold text-white">
          FAQ
        </h2>
      </div>

      <Accordion type="single" collapsible className="space-y-3">
        {faqs.map((faq, index) => (
          <AccordionItem
            key={index}
            value={`item-${index}`}
            className="border border-neutral-700 rounded-lg px-5 bg-neutral-800/30"
          >
            <AccordionTrigger className="text-left text-white hover:text-neutral-300 text-sm sm:text-base py-4">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-neutral-400 text-sm pb-4">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
