// Helper RBAC frontend — cek apakah user login punya permission tertentu.
// Sumber: localStorage.user.permissions (diisi saat login / refresh /auth/me)

import { getUser } from "./storage";

export { getUser };

export function getPermissions() {
  const user = getUser();
  return Array.isArray(user?.permissions) ? user.permissions : [];
}

export function hasPermission(key) {
  if (!key) return true;
  return getPermissions().includes(key);
}

export function hasAnyPermission(keys) {
  if (!Array.isArray(keys)) return hasPermission(keys);
  return keys.some((key) => hasPermission(key));
}
