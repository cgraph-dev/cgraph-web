/**
 * Public surface for the Web Push integration.
 *
 * Backend lives at `apps/backend/lib/cgraph/notifications/web_push_dispatcher.ex`.
 * Server endpoint: `POST/GET/DELETE /api/v1/me/push-subscriptions`.
 */

export {
  isPushSupported,
  getPushPermission,
  requestPushPermission,
  type PushPermission,
} from './permission';

export { registerServiceWorker } from './register-sw';
export { subscribeToPush, urlBase64ToUint8Array } from './subscribe';
export { unsubscribeFromPush } from './unsubscribe';
