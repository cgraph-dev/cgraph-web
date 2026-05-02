import { http } from '@/lib/api-client';
import type { AuditEntry, AuditLogResponse, ApiAuditResponse } from './types';
// Response Transformer
function transformAuditResponse(data: ApiAuditResponse): AuditEntry {
  return {
    id: data.id,
    category: data.category,
    action: data.action,
    actorId: data.actor_id,
    actorUsername: data.actor_username,
    targetId: data.target_id,
    metadata: data.metadata || {},
    ipAddress: data.ip_address,
    timestamp: data.timestamp,
  };
}
// API Functions
export const auditApi = {
  /**
   * Get audit log entries
   */
  async getAuditLog(params: {
    category?: string;
    action?: string;
    actorId?: string;
    startDate?: string;
    endDate?: string;
    cursor?: string;
    limit?: number;
  }): Promise<AuditLogResponse> {
    const response = await http.get('/api/v1/admin/audit', { params });
    return {
      entries: response.data.data.map(transformAuditResponse),
      totalCount: response.data.meta.total_count,
      nextCursor: response.data.meta.next_cursor ?? null,
      hasNext: response.data.meta.has_next ?? false,
    };
  },
};
