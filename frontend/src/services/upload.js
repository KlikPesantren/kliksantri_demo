import api from "./api";

export async function uploadImage(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await api.post("/upload/image", formData);

  return res.data?.url ?? null;
}
