/**
 * Post editor formatting toolbar component.
 */
import { motion } from 'motion/react';
import { EyeIcon, PencilSquareIcon, CodeBracketSquareIcon } from '@heroicons/react/24/outline';
import { TOOLBAR_BUTTONS } from './constants';
import type { EditorToolbarProps } from './types';

/**
 * EditorToolbar Component
 *
 * Formatting toolbar with markdown shortcuts and source/visual/preview toggle
 */
export function EditorToolbar({
  editorMode,
  setEditorMode,
  onInsertFormatting,
}: EditorToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] p-2">
      {editorMode !== 'visual' &&
        TOOLBAR_BUTTONS.map((button, index) =>
          button.tag === 'divider' ? (
            <div key={index} className="mx-1 h-6 w-px bg-[var(--token-card-bg)]" />
          ) : (
            <motion.button
              key={button.tag}
              whileHover={{ opacity: 0.9 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onInsertFormatting(button.tag)}
              className="rounded p-2 text-gray-400 transition-colors hover:bg-[var(--token-card-bg)] hover:text-white"
              title={button.label}
            >
              {button.icon && <button.icon className="h-4 w-4" />}
            </motion.button>
          )
        )}

      <div className="flex-1" />

      {/* Mode Toggle */}
      <div className="flex items-center rounded-lg bg-[var(--token-card-bg)] p-0.5">
        <button
          onClick={() => setEditorMode('source')}
          className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm transition-colors ${
            editorMode === 'source' ? 'bg-[var(--token-card-bg)] text-white' : 'text-gray-400'
          }`}
          title="Markdown source editor"
        >
          <CodeBracketSquareIcon className="h-4 w-4" />
          Source
        </button>
        <button
          onClick={() => setEditorMode('visual')}
          className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm transition-colors ${
            editorMode === 'visual' ? 'bg-[var(--token-card-bg)] text-white' : 'text-gray-400'
          }`}
          title="Visual WYSIWYG editor"
        >
          <PencilSquareIcon className="h-4 w-4" />
          Visual
        </button>
        <button
          onClick={() => setEditorMode('preview')}
          className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm transition-colors ${
            editorMode === 'preview' ? 'bg-[var(--token-card-bg)] text-white' : 'text-gray-400'
          }`}
          title="Preview rendered output"
        >
          <EyeIcon className="h-4 w-4" />
          Preview
        </button>
      </div>
    </div>
  );
}

export default EditorToolbar;
