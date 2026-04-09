"use server"
export async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append("file", file); // key must match 'file' in FileInterceptor

  const response = await fetch(`${process.env.API_URL}/upload/single`, {
    method: "POST",
    body: formData,
    // Don't set Content-Type manually! Browser will do it.
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Upload failed");
  }

  return response.json(); // server response
}
