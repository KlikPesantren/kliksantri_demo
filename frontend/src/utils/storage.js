const USER_KEY = "user";
export const PERMISSIONS_UPDATED_EVENT = "kliksantri:permissions-updated";

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY)) || null;
  } catch {
    return null;
  }
}

export function setUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new CustomEvent(PERMISSIONS_UPDATED_EVENT));
}

export function clearUser() {
  localStorage.removeItem(USER_KEY);
}
