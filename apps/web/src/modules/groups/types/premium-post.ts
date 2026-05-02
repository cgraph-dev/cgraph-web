/**
 * Premium Post Types
 *
 * Type definitions for premium (node-gated) posts within groups.
 * Authors set a price in Nodes; readers pay to unlock full content.
 *
 */
export interface PremiumPost {
  readonly id: string;
  readonly groupId: string;
  readonly title: string;
  readonly content: string;
  readonly mediaUrls: readonly string[];
  readonly priceNodes: number;
  readonly previewLength: number;
  readonly purchaseCount: number;
  readonly purchased: boolean;
  readonly isAuthor: boolean;
  readonly author: {
    readonly id: string;
    readonly username: string;
    readonly displayName: string | null;
    readonly avatarUrl: string | null;
  };
  readonly insertedAt: string;
}

export interface CreatePremiumPostPayload {
  readonly title: string;
  readonly content: string;
  readonly mediaUrls: readonly string[];
  readonly priceNodes: number;
  readonly previewLength: number;
}
