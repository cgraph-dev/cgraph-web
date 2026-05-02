/**
 * SubscriberFlair — inline badge showing subscriber flair next to username.
 *
 * Renders a small colored pill with the flair text using the tier's
 * flair color as a semi-transparent background. Returns null if no text.
 *
 */
interface SubscriberFlairProps {
  readonly flairText?: string;
  readonly flairColor?: string;
}
/** Subscriber Flair. */
export function SubscriberFlair({ flairText, flairColor }: SubscriberFlairProps) {
  if (!flairText) return null;

  const color = flairColor ?? '#6366f1';

  return (
    <span
      className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none"
      style={{
        backgroundColor: `${color}30`,
        color,
      }}
    >
      {flairText}
    </span>
  );
}

export default SubscriberFlair;
