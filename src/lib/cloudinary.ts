export async function uploadToCloudinary(file: File): Promise<string> {
  const cloudName = "lgxaebej";
  const uploadPreset = "nzniozzx";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();

  if (!res.ok || !data.secure_url) {
    throw new Error(data?.error?.message || "فشل رفع الصورة");
  }

  return data.secure_url as string;
}
