/**
 * Contact Card Message — displays shared contact information as a message bubble.
 * Mirrors Telegram's contact card display: avatar, name, phone number, username,
 * and a "Send Message" button for registered users.
 */
import type { ReactNode } from 'react';
import type { ContactCardData } from '@cgraph/shared-types';
import { useNavigate } from 'react-router-dom';

interface ContactCardMessageProps {
  readonly contactData: ContactCardData;
  readonly className?: string;
}

/**
 * Renders a contact card with avatar (or initials fallback), display name,
 * optional phone/username, and a "Send Message" action for registered users.
 */
function ContactCardMessage(props: ContactCardMessageProps): ReactNode {
  const navigate = useNavigate();
  const { contactData } = props;
  const displayName = [contactData.firstName, contactData.lastName].filter(Boolean).join(' ');
  const initials = (contactData.firstName[0] ?? '').toUpperCase();

  function handleSendMessage(): void {
    if (contactData.userId) {
      navigate(`/conversations/new?userId=${contactData.userId}`);
    }
  }

  return (
    <div
      className={`bg-surface-secondary flex items-center gap-3 rounded-lg p-3 ${props.className ?? ''}`}
    >
      {contactData.avatarUrl ? (
        <img
          src={contactData.avatarUrl}
          alt={displayName}
          className="h-12 w-12 rounded-full object-cover"
        />
      ) : (
        <div className="bg-primary/20 flex h-12 w-12 items-center justify-center rounded-full font-semibold text-primary">
          {initials}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{displayName}</p>
        {contactData.phoneNumber && (
          <p className="text-text-secondary truncate text-sm">{contactData.phoneNumber}</p>
        )}
        {contactData.username && (
          <p className="text-text-secondary truncate text-sm">@{contactData.username}</p>
        )}
      </div>
      {contactData.userId && (
        <button
          type="button"
          onClick={handleSendMessage}
          className="whitespace-nowrap rounded-lg bg-primary px-3 py-1.5 text-sm text-white"
        >
          Send Message
        </button>
      )}
    </div>
  );
}

export { ContactCardMessage };
