import React, { useId } from 'react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  readonly label?: string;
  readonly error?: string;
  readonly hint?: string;
  readonly leftIcon?: React.ReactNode;
  readonly rightIcon?: React.ReactNode;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly fullWidth?: boolean;
}
/** Input. */
export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  size = 'md',
  fullWidth = true,
  id,
  className = '',
  ref,
  ...props
}: InputProps & { ref?: React.Ref<HTMLInputElement> }) {
  const generatedId = useId();
  const inputId = id ?? `input-${generatedId}`;

  const sizeStyles: Record<typeof size, string> = {
    sm: 'min-h-9 py-1.5 text-sm',
    md: 'min-h-10 py-2 text-sm',
    lg: 'min-h-11 py-2.5 text-base',
  };

  const paddingLeft = leftIcon ? 'pl-10' : 'pl-3';
  const paddingRight = rightIcon ? 'pr-10' : 'pr-3';

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1 block text-sm font-medium text-[var(--token-text-secondary)]"
        >
          {label}
          {props.required && (
            <span className="ml-1 text-[var(--token-feedback-error)]">*</span>
          )}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--token-text-muted)]">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`cgraph-field block ${sizeStyles[size]} ${paddingLeft} ${paddingRight} ${fullWidth ? 'w-full' : ''} disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
          data-cgraph-material="recessed"
          data-cgraph-state={error ? 'error' : props.disabled ? 'disabled' : 'idle'}
          data-cgraph-surface="field"
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {rightIcon && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--token-text-muted)]">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-sm text-[var(--token-feedback-error)]">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${inputId}-hint`} className="mt-1 text-sm text-[var(--token-text-muted)]">
          {hint}
        </p>
      )}
    </div>
  );
}
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  readonly label?: string;
  readonly error?: string;
  readonly hint?: string;
  readonly fullWidth?: boolean;
}
/** Textarea. */
export function Textarea({
  label,
  error,
  hint,
  fullWidth = true,
  id,
  className = '',
  ref,
  ...props
}: TextareaProps & { ref?: React.Ref<HTMLTextAreaElement> }) {
  const generatedId = useId();
  const textareaId = id ?? `textarea-${generatedId}`;

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label
          htmlFor={textareaId}
          className="mb-1 block text-sm font-medium text-[var(--token-text-secondary)]"
        >
          {label}
          {props.required && (
            <span className="ml-1 text-[var(--token-feedback-error)]">*</span>
          )}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        className={`cgraph-field block min-h-[100px] resize-y px-3 py-2 text-sm ${fullWidth ? 'w-full' : ''} disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        data-cgraph-material="recessed"
        data-cgraph-state={error ? 'error' : props.disabled ? 'disabled' : 'idle'}
        data-cgraph-surface="field"
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined}
        {...props}
      />
      {error && (
        <p
          id={`${textareaId}-error`}
          className="mt-1 text-sm text-[var(--token-feedback-error)]"
        >
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${textareaId}-hint`} className="mt-1 text-sm text-[var(--token-text-muted)]">
          {hint}
        </p>
      )}
    </div>
  );
}
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  readonly label?: string;
  readonly error?: string;
  readonly hint?: string;
  readonly options: ReadonlyArray<{ value: string; label: string; disabled?: boolean }>;
  readonly placeholder?: string;
  readonly fullWidth?: boolean;
}
/** Select. */
export function Select({
  label,
  error,
  hint,
  options,
  placeholder,
  fullWidth = true,
  id,
  className = '',
  ref,
  ...props
}: SelectProps & { ref?: React.Ref<HTMLSelectElement> }) {
  const generatedId = useId();
  const selectId = id ?? `select-${generatedId}`;

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label
          htmlFor={selectId}
          className="mb-1 block text-sm font-medium text-[var(--token-text-secondary)]"
        >
          {label}
          {props.required && (
            <span className="ml-1 text-[var(--token-feedback-error)]">*</span>
          )}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={`cgraph-field block min-h-10 px-3 py-2 text-sm ${fullWidth ? 'w-full' : ''} disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        data-cgraph-material="recessed"
        data-cgraph-state={error ? 'error' : props.disabled ? 'disabled' : 'idle'}
        data-cgraph-surface="field"
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={`${selectId}-error`} className="mt-1 text-sm text-[var(--token-feedback-error)]">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${selectId}-hint`} className="mt-1 text-sm text-[var(--token-text-muted)]">
          {hint}
        </p>
      )}
    </div>
  );
}
export default Input;
