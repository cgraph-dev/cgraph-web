/**
 * Contact card data structure for sharing contacts as messages.
 * Mirrors Telegram's TL_messageMediaContact: phone_number, first_name,
 * last_name, vcard, user_id.
 */
export interface ContactCardData {
  readonly firstName: string;
  readonly lastName?: string;
  readonly phoneNumber?: string;
  readonly username?: string;
  readonly userId?: string;
  readonly avatarUrl?: string;
}
