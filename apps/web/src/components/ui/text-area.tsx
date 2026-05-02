import { type Ref, TextareaHTMLAttributes, useState, useEffect, useRef } from 'react';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  readonly label?: string;
  readonly error?: string;
  readonly autoResize?: boolean;
  readonly maxRows?: number;
}
/** Text Area. */
function TextArea({
  label,
  error,
  autoResize = false,
  maxRows = 10,
  className = '',
  ref,
  ...props
}: TextAreaProps & { ref?: Ref<HTMLTextAreaElement> }) {
  const [height, setHeight] = useState<string | undefined>(undefined);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const setRefs = (element: HTMLTextAreaElement | null) => {
    textareaRef.current = element;
    if (typeof ref === 'function') {
      ref(element);
    } else if (ref) {
      ref.current = element;
    }
  };

  useEffect(() => {
    if (autoResize && textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 24;
      const maxHeight = lineHeight * maxRows;
      const newHeight = Math.min(textarea.scrollHeight, maxHeight);
      setHeight(`${newHeight}px`);
    }
  }, [props.value, autoResize, maxRows]);

  return (
    <div className="w-full">
      {label && <label className="mb-2 block text-sm font-medium text-gray-300">{label}</label>}
      <textarea
        ref={setRefs}
        className={`w-full resize-none rounded-lg border bg-[var(--token-bg-secondary)] px-4 py-3 text-white placeholder-[var(--token-text-muted)] transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 ${
          error ? 'border-red-500' : 'border-[var(--token-card-border)]'
        } ${className}`}
        style={autoResize ? { height, overflow: height ? 'hidden' : 'auto' } : undefined}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
}
export default TextArea;
