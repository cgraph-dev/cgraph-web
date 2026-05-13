import { motion, AnimatePresence } from 'motion/react';
import type { GroupMember, GroupRole } from './types';
import { FADE_IN } from '@/lib/animations/transitions';

interface RoleAssignmentModalProps {
  memberId: string | null;
  members: GroupMember[];
  availableRoles: GroupRole[];
  selectedRoleIds: Set<string>;
  onToggleRole: (roleId: string) => void;
  onSave: () => void;
  onClose: () => void;
}

/**
 * Role Assignment Modal dialog component.
 */
export function RoleAssignmentModal({
  memberId,
  members,
  availableRoles,
  selectedRoleIds,
  onToggleRole,
  onSave,
  onClose,
}: RoleAssignmentModalProps) {
  const member = members.find((m) => m.id === memberId);
  const displayName = member?.displayName || member?.username;

  return (
    <AnimatePresence>
      {memberId && (
        <motion.div
          {...FADE_IN}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md space-y-4 rounded-xl border border-[var(--token-card-border)] bg-[var(--token-card-bg)] p-6 shadow-2xl"
          >
            <h3 className="text-lg font-semibold text-white">Assign Roles</h3>
            <p className="text-sm text-gray-400">Select the roles for {displayName}</p>

            <div className="max-h-64 space-y-2 overflow-y-auto">
              {availableRoles
                .sort((a, b) => b.position - a.position)
                .map((role) => (
                  <label
                    key={role.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-[var(--token-card-bg)]"
                  >
                    <input
                      type="checkbox"
                      checked={selectedRoleIds.has(role.id)}
                      onChange={() => onToggleRole(role.id)}
                      className="h-4 w-4 rounded border-[var(--token-card-border)] bg-[var(--token-card-bg)/0.4] text-primary-600"
                    />
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: role.color }} />
                    <span className="text-sm text-white">{role.name}</span>
                  </label>
                ))}
              {availableRoles.length === 0 && (
                <p className="py-4 text-center text-sm text-gray-500">No roles configured</p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={onSave}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
              >
                Save Roles
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
