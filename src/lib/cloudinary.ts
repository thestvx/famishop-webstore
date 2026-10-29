export type CloudinaryUploadResult = {
  url: string;
  publicId: string;
};

export async function uploadToCloudinary(file: File): Promise<string> {
  const result = await uploadToCloudinaryWithProgress(file);
  return result.url;
}

export function uploadToCloudinaryWithProgress(
  file: File,
  onProgress?: (percent: number) => void
): Promise<CloudinaryUploadResult> {
  const cloudName = "lgxaebej";
  const uploadPreset = "nzniozzx";

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      let data: any = null;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        data = null;
      }
      if (xhr.status >= 200 && xhr.status < 300 && data?.secure_url) {
        resolve({ url: data.secure_url as string, publicId: data.public_id as string });
      } else {
        reject(new Error(data?.error?.message || "Upload failed"));
      }
    };

    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(formData);
  });
}