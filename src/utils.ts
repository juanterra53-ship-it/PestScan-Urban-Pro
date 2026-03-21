/**
 * PESTSCAN PRO - SHARED UTILITIES
 */

/**
 * Resizes a base64 image to a maximum width while maintaining aspect ratio.
 * Returns a base64 string (without the data:image/jpeg;base64, prefix).
 */
export const resizeImage = async (base64: string, maxWidth = 800): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
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
        reject(new Error("Could not get canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      // Use lower quality (0.6) to further reduce file size and Egress
      const resizedBase64 = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
      resolve(resizedBase64);
    };
    img.onerror = (err) => reject(err);
    // Se for um Blob URL (blob:) ou Data URL (data:), não adicionamos o prefixo
    if (base64.startsWith('blob:') || base64.startsWith('data:')) {
      img.src = base64;
    } else {
      img.src = `data:image/jpeg;base64,${base64}`;
    }
  });
};

/**
 * Converts a base64 string to a Blob.
 */
export const base64ToBlob = (base64: string, contentType = 'image/jpeg'): Blob => {
  const byteCharacters = atob(base64);
  const byteArrays = [];
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  return new Blob(byteArrays, { type: contentType });
};
