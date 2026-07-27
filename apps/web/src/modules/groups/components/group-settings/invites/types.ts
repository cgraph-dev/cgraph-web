export interface GroupInviteView {
  id: string;
  code: string;
  url: string;
  uses: number | null;
  maxUses: number | null;
  expiresAt: string | null;
  createdAt: string | null;
  revoked: boolean;
  inviter: {
    id: string | null;
    username: string | null;
    displayName: string | null;
  } | null;
}

export interface CreateInviteOptions {
  expirationSeconds: number | null;
  maxUses: number | null;
}

export type InviteOperationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
