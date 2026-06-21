import api from "./api";

export async function uploadImage(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await api.post("/upload/image", formData);

  const url = res.data?.url ?? null;
  console.log("[ADMIN BANNER UPLOAD RESPONSE]", url);
  return url;
}
