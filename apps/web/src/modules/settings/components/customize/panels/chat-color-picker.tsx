import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Copy, Palette, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  getChatThemeCustomColorStyle,
  resolveChatThemeConversationColor,
  type ChatThemeCustomColor,
} from '@cgraph-dev/shared-types/chat-theme';
import { getConversationColorSwatch, CONVERSATION_COLOR_IDS } from '@/modules/chat/theme/conversation-color-palette';
import { useCustomizationStore } from '@/modules/settings/store/customization/customizationStore';

interface ChatColorPickerProps {
  readonly conversationId?: string;
}

type EditorTarget =
  | { readonly id: string; readonly color: ChatThemeCustomColor }
  | { readonly id: null; readonly color: ChatThemeCustomColor };

const DEFAULT_CUSTOM_COLOR: ChatThemeCustomColor = {
  start: { hue: 220, saturation: 84 },
  deg: 180,
};

export function ChatColorPicker({ conversationId }: ChatColorPickerProps) {
  const defaultConversationColor = useCustomizationStore((state) => state.defaultConversationColor);
  const customChatColors = useCustomizationStore((state) => state.customChatColors);
  const conversationOverride = useCustomizationStore((state) =>
    conversationId ? state.conversationChatThemeOverrides[conversationId] : undefined,
  );
  const setDefaultConversationColor = useCustomizationStore(
    (state) => state.setDefaultConversationColor,
  );
  const setConversationChatThemeColor = useCustomizationStore(
    (state) => state.setConversationChatThemeColor,
  );
  const addCustomChatColor = useCustomizationStore((state) => state.addCustomChatColor);
  const editCustomChatColor = useCustomizationStore((state) => state.editCustomChatColor);
  const removeCustomChatColor = useCustomizationStore((state) => state.removeCustomChatColor);
  const resetDefaultConversationColor = useCustomizationStore(
    (state) => state.resetDefaultConversationColor,
  );
  const resetConversationChatThemeColor = useCustomizationStore(
    (state) => state.resetConversationChatThemeColor,
  );
  const resetAllConversationChatThemeColors = useCustomizationStore(
    (state) => state.resetAllConversationChatThemeColors,
  );
  const [editorTarget, setEditorTarget] = useState<EditorTarget | null>(null);
  const [colorIdPendingRemoval, setColorIdPendingRemoval] = useState<string | null>(null);
  const [confirmResetAll, setConfirmResetAll] = useState(false);

  const selectedColor = useMemo(
    () =>
      resolveChatThemeConversationColor(
        conversationOverride ?? {},
        defaultConversationColor,
      ),
    [conversationOverride, defaultConversationColor],
  );
  const customColorIds = useMemo(() => {
    const ordered = customChatColors.order ?? [];
    const remaining = Object.keys(customChatColors.colors).filter((id) => !ordered.includes(id));
    return [...ordered.filter((id) => Boolean(customChatColors.colors[id])), ...remaining];
  }, [customChatColors]);
  const selectedCustomColor = useMemo(() => {
    if (selectedColor.conversationColor !== 'custom' || !selectedColor.customColorId) {
      return undefined;
    }

    const color = customChatColors.colors[selectedColor.customColorId];
    return color ? { id: selectedColor.customColorId, color } : undefined;
  }, [customChatColors.colors, selectedColor]);
  const hasConversationOverride = Boolean(conversationId && conversationOverride);

  function selectNamedColor(color: (typeof CONVERSATION_COLOR_IDS)[number]) {
    if (conversationId) {
      setConversationChatThemeColor(conversationId, color);
      return;
    }

    setDefaultConversationColor(color);
  }

  function selectCustomColor(id: string, color: ChatThemeCustomColor) {
    if (conversationId) {
      setConversationChatThemeColor(conversationId, 'custom', { id, value: color });
      return;
    }

    setDefaultConversationColor('custom', { id, value: color });
  }

  function saveCustomColor(color: ChatThemeCustomColor) {
    if (!editorTarget) return;

    if (editorTarget.id) {
      editCustomChatColor(editorTarget.id, color);
      selectCustomColor(editorTarget.id, color);
    } else {
      addCustomChatColor(color, conversationId);
    }
    setEditorTarget(null);
  }

  return (
    <section className="space-y-4" aria-label={conversationId ? 'Conversation color' : 'Default chat color'}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Palette className="h-4 w-4 text-primary-300" aria-hidden="true" />
          <span>{conversationId ? 'Conversation Color' : 'Default Conversation Color'}</span>
        </div>
        {conversationId && hasConversationOverride ? (
          <IconButton
            label="Reset conversation color"
            onClick={() => resetConversationChatThemeColor(conversationId)}
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
          </IconButton>
        ) : null}
      </div>

      <div className="grid grid-cols-6 gap-2 sm:grid-cols-11" role="listbox" aria-label="Chat colors">
        {CONVERSATION_COLOR_IDS.map((color) => {
          const swatch = getConversationColorSwatch(color);
          const selected = selectedColor.conversationColor === color;

          return (
            <button
              key={color}
              type="button"
              role="option"
              aria-label={color}
              aria-selected={selected}
              title={color}
              className={`h-9 rounded-md border transition focus:outline-none focus:ring-2 focus:ring-white/80 ${
                selected
                  ? 'border-white ring-2 ring-primary-300/70'
                  : 'border-white/15 hover:border-white/60'
              }`}
              style={{ background: swatch.background }}
              onClick={() => selectNamedColor(color)}
            />
          );
        })}
      </div>

      {customColorIds.length > 0 ? (
        <div className="grid grid-cols-6 gap-2 sm:grid-cols-11" role="listbox" aria-label="Custom chat colors">
          {customColorIds.map((colorId) => {
            const color = customChatColors.colors[colorId];
            if (!color) return null;
            const selected = selectedCustomColor?.id === colorId;

            return (
              <button
                key={colorId}
                type="button"
                role="option"
                aria-label={`Custom color ${colorId}`}
                aria-selected={selected}
                title="Custom color"
                className={`h-9 w-full rounded-md border transition focus:outline-none focus:ring-2 focus:ring-white/80 ${
                  selected
                    ? 'border-white ring-2 ring-primary-300/70'
                    : 'border-white/15 hover:border-white/60'
                }`}
                style={getChatThemeCustomColorStyle(color)}
                onClick={() => selectCustomColor(colorId, color)}
              />
            );
          })}
        </div>
      ) : null}

      <div className="flex items-center gap-1">
        <IconButton
          label="Create custom color"
          className="h-9 w-9 border border-dashed border-white/35 text-white/80 hover:border-white hover:text-white"
          onClick={() => setEditorTarget({ id: null, color: DEFAULT_CUSTOM_COLOR })}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </IconButton>
        {selectedCustomColor ? (
          <div className="flex items-center gap-1" role="group" aria-label="Selected custom color actions">
            <IconButton
              label="Edit custom color"
              onClick={() => setEditorTarget(selectedCustomColor)}
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            </IconButton>
            <IconButton
              label="Duplicate custom color"
              onClick={() => addCustomChatColor(selectedCustomColor.color, conversationId)}
            >
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            </IconButton>
            <IconButton
              label="Delete custom color"
              onClick={() => setColorIdPendingRemoval(selectedCustomColor.id)}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </IconButton>
          </div>
        ) : null}
      </div>

      {!conversationId ? (
        <div className="flex items-center justify-end gap-1">
          <IconButton label="Reset default color" onClick={resetDefaultConversationColor}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
          </IconButton>
          <IconButton label="Reset all conversation colors" onClick={() => setConfirmResetAll(true)}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </IconButton>
        </div>
      ) : null}

      <ChatColorEditor
        target={editorTarget}
        onClose={() => setEditorTarget(null)}
        onSave={saveCustomColor}
      />
      <ConfirmDialog
        open={colorIdPendingRemoval !== null}
        title="Delete custom color"
        actionLabel="Delete"
        onClose={() => setColorIdPendingRemoval(null)}
        onConfirm={() => {
          if (colorIdPendingRemoval) removeCustomChatColor(colorIdPendingRemoval);
          setColorIdPendingRemoval(null);
        }}
      />
      <ConfirmDialog
        open={confirmResetAll}
        title="Reset all conversation colors"
        actionLabel="Reset"
        onClose={() => setConfirmResetAll(false)}
        onConfirm={() => {
          resetAllConversationChatThemeColors();
          setConfirmResetAll(false);
        }}
      />
    </section>
  );
}

function ChatColorEditor({
  target,
  onClose,
  onSave,
}: {
  readonly target: EditorTarget | null;
  readonly onClose: () => void;
  readonly onSave: (color: ChatThemeCustomColor) => void;
}) {
  const [color, setColor] = useState<ChatThemeCustomColor>(DEFAULT_CUSTOM_COLOR);

  useEffect(() => {
    if (target) setColor(target.color);
  }, [target]);

  const editorColor = color;
  const start = editorColor.start;
  const end = editorColor.end ?? DEFAULT_CUSTOM_COLOR.start;
  const isGradient = Boolean(editorColor.end);
  const previewStyle = getChatThemeCustomColorStyle(editorColor);

  function closeEditor() {
    setColor(DEFAULT_CUSTOM_COLOR);
    onClose();
  }

  function updateColor(next: ChatThemeCustomColor) {
    setColor(next);
  }

  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && closeEditor()}>
      <DialogContent ariaLabel="Custom color editor" className="max-h-[calc(100vh-2rem)] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{target?.id ? 'Edit Custom Color' : 'Custom Color'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          <div className="h-20 rounded-md border border-white/15" style={previewStyle} />
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="Color type">
            <button
              type="button"
              aria-pressed={!isGradient}
              className={editorTabClass(!isGradient)}
              onClick={() => updateColor({ ...editorColor, end: undefined })}
            >
              Solid
            </button>
            <button
              type="button"
              aria-pressed={isGradient}
              className={editorTabClass(isGradient)}
              onClick={() => updateColor({ ...editorColor, end })}
            >
              Gradient
            </button>
          </div>
          <ColorControls
            label="Start color"
            color={start}
            onChange={(next) => updateColor({ ...editorColor, start: next })}
          />
          {isGradient ? (
            <>
              <ColorControls
                label="End color"
                color={end}
                onChange={(next) => updateColor({ ...editorColor, end: next })}
              />
              <RangeControl
                label="Gradient angle"
                min={0}
                max={360}
                value={editorColor.deg ?? 180}
                onChange={(deg) => updateColor({ ...editorColor, deg })}
              />
            </>
          ) : null}
        </div>
        <DialogFooter>
          <button type="button" className="rounded-md border border-white/20 px-3 py-2 text-sm text-white/80 transition hover:border-white/50 hover:text-white" onClick={closeEditor}>
            Cancel
          </button>
          <button
            type="button"
            className="rounded-md bg-primary-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-primary-400"
            onClick={() => onSave(editorColor)}
          >
            Save
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ColorControls({
  label,
  color,
  onChange,
}: {
  readonly label: string;
  readonly color: ChatThemeCustomColor['start'];
  readonly onChange: (color: ChatThemeCustomColor['start']) => void;
}) {
  return (
    <div className="space-y-3">
      <span className="text-sm font-medium text-white">{label}</span>
      <RangeControl
        label={`${label} hue`}
        min={0}
        max={360}
        value={color.hue}
        onChange={(hue) => onChange({ ...color, hue })}
      />
      <RangeControl
        label={`${label} saturation`}
        min={0}
        max={100}
        value={color.saturation}
        onChange={(saturation) => onChange({ ...color, saturation })}
      />
    </div>
  );
}

function RangeControl({
  label,
  min,
  max,
  value,
  onChange,
}: {
  readonly label: string;
  readonly min: number;
  readonly max: number;
  readonly value: number;
  readonly onChange: (value: number) => void;
}) {
  return (
    <label className="block space-y-1 text-xs text-white/70">
      <span>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        className="w-full accent-primary-400"
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function ConfirmDialog({
  open,
  title,
  actionLabel,
  onClose,
  onConfirm,
}: {
  readonly open: boolean;
  readonly title: string;
  readonly actionLabel: string;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent ariaLabel={title}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <DialogFooter>
          <button type="button" className="rounded-md border border-white/20 px-3 py-2 text-sm text-white/80 transition hover:border-white/50 hover:text-white" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="rounded-md bg-red-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-400"
            onClick={onConfirm}
          >
            {actionLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function IconButton({
  label,
  children,
  className = '',
  onClick,
}: {
  readonly label: string;
  readonly children: ReactNode;
  readonly className?: string;
  readonly onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/15 bg-white/[0.08] text-white/80 transition hover:border-white/50 hover:bg-white/[0.14] hover:text-white focus:outline-none focus:ring-2 focus:ring-primary-300 ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function editorTabClass(selected: boolean): string {
  return `h-9 rounded-md border px-3 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-primary-300 ${
    selected
      ? 'border-primary-300 bg-primary-500/25 text-white'
      : 'border-white/15 bg-white/[0.06] text-white/70 hover:border-white/40 hover:text-white'
  }`;
}
