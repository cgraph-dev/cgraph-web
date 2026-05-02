/**
 * Group subscription API service.
 * Handles node-gated group subscription operations.
 *
 */

import { http } from '@/lib/api-client';
import type { GroupSubscription } from '@/modules/groups/store/group-types';

/**
 * Subscribe to a node-gated group by paying nodes.
 *
 * @param groupId - The group to subscribe to.
 * @returns The created subscription data.
 */
export async function subscribeToGroup(groupId: string): Promise<GroupSubscription> {
  const res = await http.post(`/api/v1/groups/${groupId}/subscribe`);
  return res.data.data;
}

/**
 * Cancel an active group subscription.
 *
 * @param groupId - The group to cancel subscription for.
 */
export async function cancelGroupSubscription(groupId: string): Promise<void> {
  await http.delete(`/api/v1/groups/${groupId}/subscribe`);
}

/**
 * Get the current subscription status for a group.
 *
 * @param groupId - The group to check subscription for.
 * @returns The subscription data, or null if not subscribed.
 */
export async function getGroupSubscription(groupId: string): Promise<GroupSubscription | null> {
  const res = await http.get(`/api/v1/groups/${groupId}/subscription`);
  return res.data.data ?? null;
}
