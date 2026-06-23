import axios from "axios";
import { API_BASE_URL } from "./api";

export async function fetchPublicPlatformSettings() {
  const res = await axios.get(`${API_BASE_URL}/public/platform/settings`);
  return res.data?.data || null;
}

export async function fetchPublicPlatformAnnouncements() {
  const res = await axios.get(`${API_BASE_URL}/public/platform/announcements`);
  return res.data?.data || [];
}
