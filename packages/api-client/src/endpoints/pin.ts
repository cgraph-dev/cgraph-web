/**
 * PIN management endpoints for registration lock.
 *
 * Transport-only -- makes HTTP requests and returns typed results.
 * Endpoints: PUT /pin, DELETE /pin, GET /pin/status, POST /pin/verify,
 *            POST /auth/registration-lock/verify
 */
import type { AxiosInstance } from 'axios';

import { apiCall } from '../schemas/api-result';
import type { ApiResult } from '../schemas/api-result';
import {
  messageResponseSchema,
  pinStatusSchema,
  registrationLockSuccessSchema,
} from '../schemas/pin';
import type { PinSetRequest, PinStatus, RegistrationLockSuccess } from '../schemas/pin';

const PIN_BASE = '/api/v1/pin';

/** Create PIN management endpoints for registration lock operations. */
export function createPinEndpoints(http: AxiosInstance) {
  return {
    /**
     * Set or update the user's PIN. Enables registration lock.
     * If a PIN already exists, `current_pin` must be provided.
     */
    setPin(data: PinSetRequest): Promise<ApiResult<{ message: string }>> {
      return apiCall(() => http.put(PIN_BASE, data), messageResponseSchema);
    },

    /**
     * Remove the user's PIN. Disables registration lock.
     * Requires current PIN for confirmation.
     */
    removePin(currentPin: string): Promise<ApiResult<{ message: string }>> {
      return apiCall(
        () => http.delete(PIN_BASE, { data: { current_pin: currentPin } }),
        messageResponseSchema
      );
    },

    /**
     * Get PIN status (no sensitive data).
     * Returns whether PIN is set, lock state, and keyboard type.
     */
    getStatus(): Promise<ApiResult<PinStatus>> {
      return apiCall(() => http.get(`${PIN_BASE}/status`), pinStatusSchema);
    },

    /**
     * Verify PIN (for reminder flow).
     * User re-enters PIN to dismiss the periodic reminder.
     */
    verifyPin(pin: string): Promise<ApiResult<{ message: string }>> {
      return apiCall(() => http.post(`${PIN_BASE}/verify`, { pin }), messageResponseSchema);
    },

    /**
     * Verify registration lock PIN during re-registration.
     * Returns the authenticated registration payload on success.
     */
    verifyRegistrationLock(
      sessionId: string,
      pin: string
    ): Promise<ApiResult<RegistrationLockSuccess>> {
      return apiCall(
        () => http.post('/api/v1/auth/registration-lock/verify', { session_id: sessionId, pin }),
        registrationLockSuccessSchema
      );
    },
  } as const;
}
