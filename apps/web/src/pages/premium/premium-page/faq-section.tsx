/**
 * FAQ Section Component
 *
 * Displays frequently asked questions about premium subscriptions.
 */

import { GlassCard } from '@/shared/components/ui';
import { FAQ_ITEMS } from './constants';

/**
 */
/**
 * F A Q Section section component.
 */
export function FAQSection() {
  return (
    <section className="mt-16">
      <h2 className="mb-8 text-center text-2xl font-semibold text-[var(--token-text-primary)]">
        Frequently Asked Questions
      </h2>

      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
        {FAQ_ITEMS.map((faq) => (
          <GlassCard key={faq.q} className="p-6">
            <h3 className="mb-2 font-semibold text-[var(--token-text-primary)]">{faq.q}</h3>
            <p className="text-sm text-[var(--token-text-muted)]">{faq.a}</p>
          </GlassCard>
        ))}
      </div>
    </section>
  );
}
