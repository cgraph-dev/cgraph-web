import type { PermState } from './types';

/** Get Perm State. */
export function getPermState(allow: number, deny: number, bit: number): PermState {
  if (allow & bit) return 'allow';
  if (deny & bit) return 'deny';
  return 'inherit';
}

/**
 * cycle Perm State for the groups module.
 *
 * @param current - The current.
 * @returns The result.
 */
export function cyclePermState(current: PermState): PermState {
  if (current === 'inherit') return 'allow';
  if (current === 'allow') return 'deny';
  return 'inherit';
}

/**
 * apply Perm Change for the groups module.
 *
 * @param allow - The allow.
 * @param deny - The deny.
 * @param bit - The bit.
 * @param newState - The new state.
 */
export function applyPermChange(
  allow: number,
  deny: number,
  bit: number,
  newState: PermState
): { allow: number; deny: number } {
  // Clear the bit from both
  let newAllow = allow & ~bit;
  let newDeny = deny & ~bit;
  if (newState === 'allow') newAllow |= bit;
  if (newState === 'deny') newDeny |= bit;
  return { allow: newAllow, deny: newDeny };
}
