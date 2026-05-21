type FriendBlockSyncHandler = (userId: string) => void;

let friendBlockSyncHandler: FriendBlockSyncHandler | null = null;

export function registerFriendBlockSyncHandler(handler: FriendBlockSyncHandler): void {
  friendBlockSyncHandler = handler;
}

export function removeBlockedUserFromFriendCaches(userId: string): void {
  friendBlockSyncHandler?.(userId);
}
