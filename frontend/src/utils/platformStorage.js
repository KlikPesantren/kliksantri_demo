export const PLATFORM_TOKEN_KEY = "platform_token";
export const PLATFORM_USER_KEY = "platform_user";

export function getPlatformToken() {
  return localStorage.getItem(PLATFORM_TOKEN_KEY);
}

export function getPlatformUser() {
  try {
    return JSON.parse(localStorage.getItem(PLATFORM_USER_KEY)) || null;
  } catch {
    return null;
  }
}

export function setPlatformSession(token, user) {
  localStorage.setItem(PLATFORM_TOKEN_KEY, token);
  localStorage.setItem(PLATFORM_USER_KEY, JSON.stringify(user));
}

export function clearPlatformSession() {
  localStorage.removeItem(PLATFORM_TOKEN_KEY);
  localStorage.removeItem(PLATFORM_USER_KEY);
}
