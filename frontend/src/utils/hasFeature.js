import { getUser } from "./storage";

export function getTenantFeatures() {
  const user = getUser();
  if (!Array.isArray(user?.tenant_features)) {
    return null;
  }
  return user.tenant_features;
}

export function hasFeature(key) {
  if (!key) return true;

  const features = getTenantFeatures();
  if (features === null) {
    return true;
  }

  return features.includes(key);
}
