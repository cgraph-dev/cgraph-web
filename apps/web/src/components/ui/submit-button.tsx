import { useFormStatus } from 'react-dom';
import { Button } from './button';

interface SubmitButtonProps {
  readonly children: React.ReactNode;
  readonly pendingText?: string;
  readonly className?: string;
  readonly disabled?: boolean;
}
/** Submit Button. */
export function SubmitButton({ children, pendingText, className, disabled }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled} isLoading={pending} className={className}>
      {pending ? (pendingText ?? children) : children}
    </Button>
  );
}
