/** Message request status enum (Signal MessageRequestState). */
export type MessageRequestStatus = 'pending' | 'accepted' | 'rejected' | 'blocked';

/** Message request in the pending inbox. */
export interface MessageRequestItem {
  readonly id: string;
  readonly conversation_id: string;
  readonly requester_id: string;
  readonly requester_username: string | null;
  readonly requester_display_name: string | null;
  readonly requester_avatar_url: string | null;
  readonly requester_is_verified: boolean;
  readonly shared_group_count: number;
  readonly inserted_at: string;
}

/** Full message request info for a conversation. */
export interface MessageRequestInfo {
  readonly id: string;
  readonly conversation_id: string;
  readonly requester: {
    readonly id: string;
    readonly username: string | null;
    readonly display_name: string | null;
    readonly avatar_url: string | null;
    readonly is_verified: boolean;
  };
  readonly status: MessageRequestStatus;
  readonly shared_group_count: number;
  readonly auto_accepted: boolean;
  readonly reported_as_spam: boolean;
  readonly inserted_at: string;
}

/** Response from accept/reject/block actions. */
export interface MessageRequestActionResponse {
  readonly conversation_id: string;
  readonly status: MessageRequestStatus;
  readonly accepted_at?: string;
  readonly reported?: boolean;
}
