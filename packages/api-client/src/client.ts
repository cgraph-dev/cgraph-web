import type { AxiosInstance } from 'axios';

import { createNodesEndpoints } from './endpoints/nodes';
import { createCommissionEndpoints } from './endpoints/commissions';
import { createBountyEndpoints } from './endpoints/bounties';
import { createCreatorEndpoints } from './endpoints/creator';
import { createNotificationEndpoints } from './endpoints/notifications';
import { createFriendsEndpoints } from './endpoints/friends';
import { createGroupsEndpoints } from './endpoints/groups';
import { createForumsEndpoints } from './endpoints/forums';
import { createSearchEndpoints } from './endpoints/search';
import { createSyncEndpoints } from './endpoints/sync';
import { createInviteEndpoints } from './endpoints/invites';
import { createSettingsEndpoints } from './endpoints/settings';
import { createUploadEndpoints } from './endpoints/upload';
import { createMessagingEndpoints } from './endpoints/messaging';
import { createBillingEndpoints } from './endpoints/billing';
import { createAuthEndpoints } from './endpoints/auth';
import { createProfileEndpoints } from './endpoints/profile';
import { createCosmeticsEndpoints } from './endpoints/cosmetics';
import { createPresenceEndpoints } from './endpoints/presence';
import { createReactionEndpoints } from './endpoints/reactions';
import { createE2EEEndpoints } from './endpoints/e2ee';
import { createCallsEndpoints } from './endpoints/calls';
import { createMediaEndpoints } from './endpoints/media';
import { createPaidDmsEndpoints } from './endpoints/paid-dms';
import { createTranscriptionEndpoints } from './endpoints/transcription';
import { createCallQualityEndpoints } from './endpoints/call-quality';
import { createContactsEndpoints } from './endpoints/contacts';
import { createMessageRequestEndpoints } from './endpoints/message-requests';
import { createPinEndpoints } from './endpoints/pin';

export interface ApiClientConfig {
  readonly http: AxiosInstance;
}

/** Creates a fully-wired API client from the provided Axios instance. */
export function createApiClient(config: ApiClientConfig) {
  const { http } = config;

  return {
    nodes: createNodesEndpoints(http),
    commissions: createCommissionEndpoints(http),
    bounties: createBountyEndpoints(http),
    creator: createCreatorEndpoints(http),
    notifications: createNotificationEndpoints(http),
    friends: createFriendsEndpoints(http),
    groups: createGroupsEndpoints(http),
    forums: createForumsEndpoints(http),
    search: createSearchEndpoints(http),
    sync: createSyncEndpoints(http),
    invites: createInviteEndpoints(http),
    settings: createSettingsEndpoints(http),
    upload: createUploadEndpoints(http),
    messaging: createMessagingEndpoints(http),
    billing: createBillingEndpoints(http),
    auth: createAuthEndpoints(http),
    profile: createProfileEndpoints(http),
    cosmetics: createCosmeticsEndpoints(http),
    presence: createPresenceEndpoints(http),
    reactions: createReactionEndpoints(http),
    e2ee: createE2EEEndpoints(http),
    calls: createCallsEndpoints(http),
    media: createMediaEndpoints(http),
    paidDms: createPaidDmsEndpoints(http),
    transcription: createTranscriptionEndpoints(http),
    callQuality: createCallQualityEndpoints(http),
    contacts: createContactsEndpoints(http),
    messageRequests: createMessageRequestEndpoints(http),
    pin: createPinEndpoints(http),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
