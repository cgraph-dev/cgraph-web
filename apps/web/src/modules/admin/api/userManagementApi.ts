/**
 * Admin User Management API
 *
 * User listing, details, banning, and deletion endpoints.
 */

import { http } from '@/lib/api-client';
import type { AdminUser, UsersListResponse, ApiUserResponse } from './types';
// Response Transformer
function transformUserResponse(data: ApiUserResponse): AdminUser {
  return {
    id: data.id,
    username: data.username,
    email: data.email,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    status: data.status,
    insertedAt: data.inserted_at,
    lastSeenAt: data.last_seen_at,
    isPremium: data.is_premium || false,
    bannedAt: data.banned_at,
    banReason: data.ban_reason,
  };
}
// API Functions
export const userManagementApi = {
  /**
   * List users with filtering and pagination
   */
  async listUsers(params: {
    search?: string;
    status?: string;
    sort?: string;
    order?: 'asc' | 'desc';
    cursor?: string;
    limit?: number;
  }): Promise<UsersListResponse> {
    const response = await http.get('/api/v1/admin/users', { params });
    return {
      users: response.data.data.map(transformUserResponse),
      totalCount: response.data.meta.total_count,
      nextCursor: response.data.meta.next_cursor ?? null,
      hasNext: response.data.meta.has_next ?? false,
    };
  },

  /**
   * Get details for a specific user
   */
  async getUser(userId: string): Promise<AdminUser> {
    const response = await http.get(`/api/v1/admin/users/${userId}`);
    return transformUserResponse(response.data.data);
  },

  /**
   * Ban a user
   */
  async banUser(userId: string, reason: string, duration?: number): Promise<AdminUser> {
    const response = await http.post(`/api/v1/admin/users/${userId}/ban`, {
      reason,
      duration,
    });
    return transformUserResponse(response.data.data);
  },

  /**
   * Unban a user
   */
  async unbanUser(userId: string): Promise<AdminUser> {
    const response = await http.delete(`/api/v1/admin/users/${userId}/ban`);
    return transformUserResponse(response.data.data);
  },

  /**
   * Delete a user (soft delete)
   */
  async deleteUser(userId: string): Promise<void> {
    await http.delete(`/api/v1/admin/users/${userId}`);
  },
};
