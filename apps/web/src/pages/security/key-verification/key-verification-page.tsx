import { MobileOnlyFeature } from '@/components/mobile-only-feature';

/**
 * Identity key verification depends on the libsignal session state that
 * only lives on mobile and desktop (ADR-022). This route renders the
 * mobile-only placeholder on web.
 */
export default function KeyVerificationPage() {
  return (
    <MobileOnlyFeature
      feature="Key Verification"
      description="Identity keys are stored on your mobile or desktop app for safety. Open CGraph on mobile or desktop to verify a contact's keys."
    />
  );
}
