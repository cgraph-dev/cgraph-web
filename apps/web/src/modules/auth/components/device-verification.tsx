/**
 * Device verification step.
 *
 * Per ADR-022, web is not a Signal-participant device — device-key
 * attestation needs the libsignal session state that only lives on
 * mobile/desktop. This component routes users to a native client for
 * device-key setup.
 */
import type { ReactNode } from 'react';
import { MobileOnlyFeature } from '@/components/mobile-only-feature';

export function DeviceVerification(): ReactNode {
  return (
    <MobileOnlyFeature
      feature="Device verification"
      description="Device attestation uses the encryption keys stored on your mobile or desktop app. Open CGraph on mobile or desktop to finish setting up this device."
    />
  );
}
