/**
 * Compress client-side image before saving to Base64 to prevent 413 Payload Too Large
 */
export function compressImage(file: File, maxWidth = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

/**
 * Compress then upload to Google Drive. Falls back to the compressed Data URL when the upload fails.
 */
export async function uploadPhoto(file: File): Promise<string> {
  const compressed = await compressImage(file, 800, 0.7);

  try {
    const blob = await (await fetch(compressed)).blob();
    const formData = new FormData();
    formData.append('file', new File([blob], file.name, { type: blob.type || 'image/jpeg' }));

    const res = await fetch('/api/upload-drive', { method: 'POST', body: formData });
    const data = await res.json();
    if (res.ok && data.url) return data.url;
  } catch (err) {
    console.error('Upload error:', err);
  }

  return compressed;
}
