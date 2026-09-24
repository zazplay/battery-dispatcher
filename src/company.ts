import type { Dict } from './i18n/en';

/* Contact details used on the page. */
export const EMAIL = 'yz@azileon.cz';
export const PHONE = '+420 774 903 190';
export const SITE = 'https://battery.azileon.cz';

/** A mailto link that opens a message with the revenue-estimate template in the current language. */
export const mailto = (t: Dict) =>
  `mailto:${EMAIL}?subject=${encodeURIComponent(t.contact.mail.subject)}&body=${encodeURIComponent(t.contact.mail.body)}`;
