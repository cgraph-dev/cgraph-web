import { LabelHTMLAttributes, ReactNode } from 'react';

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  readonly children: ReactNode;
  readonly required?: boolean;
}
/** Label. */
export function Label({ children, required = false, className = '', ...props }: LabelProps) {
  return (
    <label className={`text-textPrimary mb-1.5 block text-sm font-medium ${className} `} {...props}>
      {children}
      {required && <span className="ml-1 text-error">*</span>}
    </label>
  );
}

export default Label;
