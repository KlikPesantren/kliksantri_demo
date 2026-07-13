const deletionUrl = process.env.EXPO_PUBLIC_ACCOUNT_DELETION_URL?.trim() || '';
const supportEmail = process.env.EXPO_PUBLIC_SUPPORT_EMAIL?.trim() || '';

export const ACCOUNT_DELETION_URL = deletionUrl.startsWith('https://')
  ? deletionUrl
  : null;

export const SUPPORT_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail)
  ? supportEmail
  : null;

export const HAS_DELETION_REQUEST_CHANNEL = Boolean(
  ACCOUNT_DELETION_URL || SUPPORT_EMAIL,
);
