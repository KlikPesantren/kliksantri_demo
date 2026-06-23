import api from "./api";

export async function uploadImage(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await api.post("/upload/image", formData);

  const url = res.data?.url ?? null;
  console.log("[ADMIN BANNER UPLOAD RESPONSE]", url);
  return url;
}

/** Platform branding upload — uses existing /upload/image via active tenant session. */
export async function uploadImageForPlatform(file) {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error(
      "Upload logo memerlukan sesi tenant aktif. Buka portal tenant, login, lalu kembali ke Platform Console."
    );
  }

  return uploadImage(file);
}
