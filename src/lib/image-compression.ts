const MAX_IMAGE_DIMENSION = 1800;
const COMPRESS_THRESHOLD = 1.2 * 1024 * 1024;
const OUTPUT_QUALITY = 0.84;

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, type, quality);
  });
}

export async function compressImageFile(file: File) {
  if (typeof window === 'undefined' || !file.type.startsWith('image/') || file.type === 'image/gif') {
    return file;
  }

  if (file.size < COMPRESS_THRESHOLD) {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    return file;
  }

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await canvasToBlob(canvas, 'image/webp', OUTPUT_QUALITY);
  if (!blob || blob.size >= file.size) {
    return file;
  }

  const baseName = file.name.replace(/\.[^.]+$/, '') || 'image';
  return new File([blob], `${baseName}.webp`, { type: 'image/webp', lastModified: Date.now() });
}
