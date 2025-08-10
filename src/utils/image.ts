export const generateFileHash = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

export const base64ToBlob = async (base64: string): Promise<Blob> => {
  const response = await fetch(base64);
  const blob = await response.blob();
  return blob;
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const resizeImage = (file: File, maxSize: number): Promise<File> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = URL.createObjectURL(file);
    image.onload = () => {
      let { width, height } = image;

      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Could not get canvas context'));
      }
      ctx.drawImage(image, 0, 0, width, height);
      
      canvas.toBlob((blob) => {
        if (!blob) {
          return reject(new Error('Canvas to Blob conversion failed'));
        }
        const newFile = new File([blob], file.name, {
          type: file.type,
          lastModified: Date.now(),
        });
        resolve(newFile);
      }, file.type);
    };
    image.onerror = reject;
  });
};