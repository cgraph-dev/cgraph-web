import { useState, type ReactNode } from 'react';
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { GlassCard } from '@/shared/components/ui';
import { PERMISSIONS, ROLE_COLORS } from './constants';
import type { RoleEditorProps } from './types';

type SectionId = 'general' | 'permissions';

export function RoleEditor({
  role,
  isNew,
  isSaving = false,
  nameError,
  onUpdate,
  onDelete,
  onSave,
}: RoleEditorProps) {
  const [expandedSections, setExpandedSections] = useState<Set<SectionId>>(
    new Set(['general', 'permissions'])
  );
  const isReadOnly = role.isDefault;

  const toggleSection = (section: SectionId) => {
    setExpandedSections((current) => {
      const next = new Set(current);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  const togglePermission = (permission: number) => {
    const permissions =
      (role.permissions & permission) !== 0
        ? role.permissions & ~permission
        : role.permissions | permission;
    onUpdate({ permissions });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${role.color}33` }}
          >
            <span className="h-6 w-6 rounded-full" style={{ backgroundColor: role.color }} />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-white">
              {isNew ? 'Create role' : isReadOnly ? 'Default role' : 'Edit role'}
            </h2>
            <p className="truncate text-sm text-gray-400">{role.name}</p>
          </div>
        </div>

        {!isReadOnly && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="danger"
              leftIcon={<TrashIcon />}
              disabled={isSaving}
              onClick={onDelete}
            >
              Delete
            </Button>
            <Button
              leftIcon={<CheckIcon />}
              isLoading={isSaving}
              disabled={isSaving}
              onClick={onSave}
            >
              {isNew ? 'Create role' : 'Save changes'}
            </Button>
          </div>
        )}
      </header>

      {isReadOnly && (
        <p
          role="status"
          className="rounded-xl border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] px-4 py-3 text-sm text-[var(--token-text-secondary)]"
        >
          The default role is managed by the group and cannot be edited, reordered, or deleted.
        </p>
      )}

      <RoleSection
        title="General"
        expanded={expandedSections.has('general')}
        onToggle={() => toggleSection('general')}
      >
        <div className="space-y-4">
          <Input
            label="Role name"
            maxLength={100}
            error={nameError ?? undefined}
            disabled={isReadOnly || isSaving}
            value={role.name}
            onChange={(event) => onUpdate({ name: event.target.value })}
          />

          <fieldset disabled={isReadOnly || isSaving}>
            <legend className="mb-2 text-sm font-medium text-gray-300">Role color</legend>
            <div className="flex flex-wrap gap-2">
              {ROLE_COLORS.map((color) => (
                <button
                  type="button"
                  key={color}
                  disabled={isReadOnly || isSaving}
                  onClick={() => onUpdate({ color })}
                  aria-label={`Set role color ${color}`}
                  aria-pressed={role.color === color}
                  className="h-9 w-9 rounded-full border border-white/15 focus:outline-none focus:ring-2 focus:ring-white disabled:cursor-not-allowed disabled:opacity-50 aria-pressed:ring-2 aria-pressed:ring-white aria-pressed:ring-offset-2 aria-pressed:ring-offset-[var(--token-bg-secondary)]"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </fieldset>

          <RoleSwitch
            id="role-hoisted"
            label="Display separately"
            description="Show members with this role in a separate group"
            checked={role.isHoisted}
            disabled={isReadOnly || isSaving}
            onCheckedChange={(checked) => onUpdate({ isHoisted: checked })}
          />
          <RoleSwitch
            id="role-mentionable"
            label="Mentionable"
            description="Allow members to mention this role"
            checked={role.isMentionable}
            disabled={isReadOnly || isSaving}
            onCheckedChange={(checked) => onUpdate({ isMentionable: checked })}
          />
        </div>
      </RoleSection>

      <RoleSection
        title="Permissions"
        expanded={expandedSections.has('permissions')}
        onToggle={() => toggleSection('permissions')}
      >
        <div className="space-y-2">
          {Object.entries(PERMISSIONS).map(([key, permission]) => (
            <RoleSwitch
              key={key}
              id={`role-permission-${key.toLowerCase()}`}
              label={permission.label}
              description={permission.description}
              danger={permission.danger}
              checked={(role.permissions & permission.value) !== 0}
              disabled={isReadOnly || isSaving}
              onCheckedChange={() => togglePermission(permission.value)}
            />
          ))}
        </div>
      </RoleSection>
    </div>
  );
}

interface RoleSectionProps {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}

function RoleSection({ title, expanded, onToggle, children }: RoleSectionProps) {
  return (
    <GlassCard variant="frosted" className="overflow-hidden">
      <Button
        variant="ghost"
        animated={false}
        aria-expanded={expanded}
        onClick={onToggle}
        className="w-full justify-between rounded-none p-4"
        rightIcon={expanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
      >
        {title}
      </Button>
      {expanded && (
        <div className="border-t border-[var(--token-border-muted)] p-4">{children}</div>
      )}
    </GlassCard>
  );
}

interface RoleSwitchProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  danger?: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function RoleSwitch({
  id,
  label,
  description,
  checked,
  disabled,
  danger = false,
  onCheckedChange,
}: RoleSwitchProps) {
  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-lg border p-3 ${
        danger
          ? 'border-red-500/20 bg-red-500/5'
          : 'border-transparent bg-[var(--token-bg-secondary)]'
      }`}
    >
      <label htmlFor={id} className="min-w-0 cursor-pointer">
        <span className={`font-medium ${danger ? 'text-red-400' : 'text-white'}`}>{label}</span>
        <span className="block text-xs text-gray-400">{description}</span>
      </label>
      <Switch
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
        className="shrink-0"
      />
    </div>
  );
}
