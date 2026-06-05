/**
 * Entitlements API service.
 *
 * Connects the frontend to the backend EntitlementController endpoints.
 *
 */

import { http } from '@/lib/api-client';
import { CosmeticTypeSchema } from '@cgraph-dev/api-client';
import type {
  Entitlement,
  CosmeticSku,
  CosmeticType,
  EntitlementType,
  EntitlementSource,
} from '@cgraph-dev/shared-types';
// API response shapes (match backend serializer output)
interface ApiCosmeticSku {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly type: string;
  readonly assetHash: string | null;
  readonly cosmeticId: string | null;
  readonly priceNodes: number;
  readonly stripePriceId: string | null;
  readonly isPremiumOnly: boolean;
  readonly isAvailable: boolean;
  readonly collection: string | null;
  readonly version: number;
}

interface ApiEntitlement {
  readonly id: string;
  readonly sku: ApiCosmeticSku;
  readonly type: string;
  readonly source: string;
  readonly grantedAt: string;
  readonly expiresAt: string | null;
  readonly active: boolean;
}

interface ApiPaginatedEntitlements {
  readonly data: readonly ApiEntitlement[];
  readonly nextCursor: string | null;
  readonly hasMore: boolean;
}
// Transformers
const VALID_ENTITLEMENT_TYPES: readonly EntitlementType[] = [
  'subscription',
  'purchase',
  'gift',
  'reward',
];

const VALID_ENTITLEMENT_SOURCES: readonly EntitlementSource[] = [
  'stripe_subscription',
  'shop_purchase',
  'achievement',
  'admin_grant',
  'gift',
  'event',
  'level',
];

function validateEntitlementType(value: string): EntitlementType {
  const match = VALID_ENTITLEMENT_TYPES.find((t) => t === value);
  return match ?? 'purchase';
}

function validateEntitlementSource(value: string): EntitlementSource {
  const match = VALID_ENTITLEMENT_SOURCES.find((s) => s === value);
  return match ?? 'shop_purchase';
}

function validateCosmeticType(value: string): CosmeticType {
  const parsed = CosmeticTypeSchema.safeParse(value);
  return parsed.success ? parsed.data : 'badge';
}

function toSku(raw: ApiCosmeticSku): CosmeticSku {
  return {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    type: validateCosmeticType(raw.type),
    assetHash: raw.assetHash,
    cosmeticId: raw.cosmeticId,
    priceNodes: raw.priceNodes,
    stripePriceId: raw.stripePriceId,
    isPremiumOnly: raw.isPremiumOnly,
    isAvailable: raw.isAvailable,
    collection: raw.collection,
    version: raw.version,
  };
}

function toEntitlement(raw: ApiEntitlement): Entitlement {
  return {
    id: raw.id,
    sku: toSku(raw.sku),
    type: validateEntitlementType(raw.type),
    source: validateEntitlementSource(raw.source),
    grantedAt: raw.grantedAt,
    expiresAt: raw.expiresAt,
    active: raw.active,
  };
}
// Paginated response type
export interface PaginatedEntitlements {
  readonly data: readonly Entitlement[];
  readonly nextCursor: string | null;
  readonly hasMore: boolean;
}
// API service
export const entitlementsApi = {
  /**
   * Fetch cursor-paginated entitlements for the current user.
   */
  async fetchEntitlements(cursor?: string, limit?: number): Promise<PaginatedEntitlements> {
    const params: Record<string, string | number> = {};
    if (cursor) params['cursor'] = cursor;
    if (limit) params['limit'] = limit;

    const response = await http.get<ApiPaginatedEntitlements>('/api/v1/entitlements', {
      params,
    });
    const raw = response.data;

    return {
      data: raw.data.map(toEntitlement),
      nextCursor: raw.nextCursor,
      hasMore: raw.hasMore,
    };
  },

  /**
   * Check whether the current user is entitled to a given SKU.
   * Uses Redis-cached backend endpoint.
   */
  async checkEntitlement(skuId: string): Promise<boolean> {
    const response = await http.get<{ entitled: boolean }>('/api/v1/entitlements/check', {
      params: { sku_id: skuId },
    });
    return response.data.entitled;
  },

  /**
   * Purchase an entitlement for the given SKU.
   */
  async purchaseEntitlement(skuId: string): Promise<Entitlement> {
    const response = await http.post<ApiEntitlement>('/api/v1/entitlements', {
      sku_id: skuId,
    });
    return toEntitlement(response.data);
  },
};
