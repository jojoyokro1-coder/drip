let pendingFile: File | null = null;

const PENDING_UPLOAD_KEY = 'drip_pending_upload';
const PENDING_UPLOAD_TYPE_KEY = 'drip_pending_upload_type';

export function setPendingFile(file: File | null) {
  pendingFile = file;
}

export function getPendingFile(): File | null {
  return pendingFile;
}

export async function stagePendingUpload(file: File) {
  setPendingFile(file);

  try {
    const reader = new FileReader();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

    sessionStorage.setItem(PENDING_UPLOAD_KEY, dataUrl);
    sessionStorage.setItem(PENDING_UPLOAD_TYPE_KEY, file.type);
  } catch (error) {
    console.warn("Could not save pending upload fallback:", error);
  }
}

export function clearPendingUploadFallback() {
  try {
    sessionStorage.removeItem(PENDING_UPLOAD_KEY);
    sessionStorage.removeItem(PENDING_UPLOAD_TYPE_KEY);
  } catch {
    /* ignore */
  }
}
