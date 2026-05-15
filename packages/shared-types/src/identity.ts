/**
 * Runtime-neutral user identity projection shared by app clients.
 *
 * This is the display identity contract. It intentionally carries IDs and
 * lightweight presentation fields, not route owners or browser-specific UI
 * state.
 */

export type IdentityStatus = 'online' | 'idle' | 'dnd' | 'offline' | 'invisible' | 'away' | 'busy';

export interface IdentityCosmetics {
  readonly avatarBorderId: string | null;
  readonly equippedTitleId: string | null;
  readonly equippedBadgeIds: readonly string[];
  readonly equippedNameplateId: string | null;
  readonly profileTheme: string | null;
  readonly chatTheme: string | null;
  readonly displayNameFont: string | null;
  readonly displayNameEffect: string | null;
  readonly displayNameColor: string | null;
  readonly displayNameSecondaryColor: string | null;
}

export interface CanonicalUserIdentity {
  readonly id: string;
  readonly username: string;
  readonly displayName: string | null;
  readonly avatarUrl: string | null;
  readonly bannerUrl: string | null;
  readonly status: IdentityStatus;
  readonly statusMessage: string | null;
  readonly cosmetics: IdentityCosmetics;
}
