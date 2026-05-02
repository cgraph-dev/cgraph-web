/**
 * Tiptap WYSIWYG editor with toolbar for visual post editing.
 */
import { useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { motion } from 'motion/react';
import '../forum-content.css';
import {
  BoldIcon,
  ItalicIcon,
  ListBulletIcon,
  LinkIcon,
  PhotoIcon,
  CodeBracketIcon,
} from '@heroicons/react/24/outline';
import { UnderlineIcon, StrikethroughIcon, QuoteIcon, HeadingIcon } from './icons';

interface WysiwygEditorProps {
  content: string;
  onChange: (html: string) => void;
}

const WYSIWYG_BUTTONS = [
  { action: 'bold', icon: BoldIcon, label: 'Bold' },
  { action: 'italic', icon: ItalicIcon, label: 'Italic' },
  { action: 'underline', icon: UnderlineIcon, label: 'Underline' },
  { action: 'strike', icon: StrikethroughIcon, label: 'Strikethrough' },
  { action: 'divider' },
  { action: 'heading', icon: HeadingIcon, label: 'Heading' },
  { action: 'blockquote', icon: QuoteIcon, label: 'Quote' },
  { action: 'codeBlock', icon: CodeBracketIcon, label: 'Code Block' },
  { action: 'bulletList', icon: ListBulletIcon, label: 'List' },
  { action: 'divider' },
  { action: 'link', icon: LinkIcon, label: 'Link' },
  { action: 'image', icon: PhotoIcon, label: 'Image' },
] as const;

/** WYSIWYG rich text editor using TipTap for forum post content. */
export function WysiwygEditor({ content, onChange }: WysiwygEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' },
      }),
      Image.configure({ inline: false }),
      Placeholder.configure({ placeholder: 'Write your post content here...' }),
    ],
    content,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none min-h-[300px] p-4 outline-none focus:outline-none',
      },
    },
  });

  // Sync external content changes (e.g. switching from source mode)
  useEffect(() => {
    if (editor && !editor.isFocused) {
      const current = editor.getHTML();
      if (content !== current) {
        editor.commands.setContent(content, { emitUpdate: false });
      }
    }
  }, [content, editor]);

  const handleAction = useCallback(
    (action: string) => {
      if (!editor) return;
      const chain = editor.chain().focus();

      switch (action) {
        case 'bold':
          chain.toggleBold().run();
          break;
        case 'italic':
          chain.toggleItalic().run();
          break;
        case 'underline':
          chain.toggleUnderline().run();
          break;
        case 'strike':
          chain.toggleStrike().run();
          break;
        case 'heading':
          chain.toggleHeading({ level: 2 }).run();
          break;
        case 'blockquote':
          chain.toggleBlockquote().run();
          break;
        case 'codeBlock':
          chain.toggleCodeBlock().run();
          break;
        case 'bulletList':
          chain.toggleBulletList().run();
          break;
        case 'link': {
          const url = window.prompt('Enter URL:');
          if (url) {
            chain.setLink({ href: url }).run();
          }
          break;
        }
        case 'image': {
          const src = window.prompt('Enter image URL:');
          if (src) {
            chain.setImage({ src }).run();
          }
          break;
        }
      }
    },
    [editor]
  );

  const isActive = useCallback(
    (action: string): boolean => {
      if (!editor) return false;
      switch (action) {
        case 'bold':
          return editor.isActive('bold');
        case 'italic':
          return editor.isActive('italic');
        case 'underline':
          return editor.isActive('underline');
        case 'strike':
          return editor.isActive('strike');
        case 'heading':
          return editor.isActive('heading', { level: 2 });
        case 'blockquote':
          return editor.isActive('blockquote');
        case 'codeBlock':
          return editor.isActive('codeBlock');
        case 'bulletList':
          return editor.isActive('bulletList');
        case 'link':
          return editor.isActive('link');
        default:
          return false;
      }
    },
    [editor]
  );

  return (
    <div>
      {/* Tiptap Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] px-2 py-1">
        {WYSIWYG_BUTTONS.map((btn, i) =>
          btn.action === 'divider' ? (
            <div key={i} className="mx-1 h-6 w-px bg-[var(--token-card-bg)]" />
          ) : (
            <motion.button
              key={btn.action}
              type="button"
              whileHover={{ opacity: 0.9 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleAction(btn.action)}
              className={`rounded p-2 transition-colors hover:bg-[var(--token-card-bg)] ${
                isActive(btn.action)
                  ? 'bg-[var(--token-card-bg)] text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
              title={btn.label}
            >
              {btn.icon && <btn.icon className="h-4 w-4" />}
            </motion.button>
          )
        )}
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  );
}

export default WysiwygEditor;
