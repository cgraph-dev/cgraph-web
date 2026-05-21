type FriendBlockSyncHandler = (userId: string) => void;

let friendBlockSyncHandler: FriendBlockSyncHandler | null = null;

/** Registers the friend-store cache cleanup callback for block events. */
export function registerFriendBlockSyncHandler(handler: FriendBlockSyncHandler): void {
  friendBlockSyncHandler = handler;
}

/** Removes a blocked user from any friend caches that are already mounted. */
export function removeBlockedUserFromFriendCaches(userId: string): void {
  friendBlockSyncHandler?.(userId);
}
