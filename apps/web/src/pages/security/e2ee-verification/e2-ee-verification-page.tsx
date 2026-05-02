import { MobileOnlyFeature } from '@/components/mobile-only-feature';

/**
 * Safety-number verification requires the encryption keys that live on a
 * Signal-participant device. Web holds no such keys (ADR-022), so the
 * route always renders the mobile-only placeholder.
 */
export default function E2EEVerificationPage() {
  return (
    <MobileOnlyFeature
      feature="Safety Number Verification"
      description="Comparing your safety number requires the encryption keys stored on your mobile or desktop app. Open CGraph on mobile or desktop to verify this conversation."
    />
  );
}
