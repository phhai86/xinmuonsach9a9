/**
 * Format bytes to readable string (KB, MB)
 */
export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 KB';
  const kb = bytes / 1024;
  if (kb > 1024) {
    return `${(kb / 1024).toFixed(1)} MB`;
  }
  return `${Math.round(kb)} KB`;
}

/**
 * Format base64 size to readable string (KB, MB)
 */
export function formatBase64Size(base64String: string): string {
  if (!base64String) return '0 KB';
  const stringLength = base64String.length - (base64String.indexOf(',') + 1);
  const sizeInBytes = 4 * Math.ceil(stringLength / 3) * 0.75;
  return formatBytes(sizeInBytes);
}

/**
 * Convert base64 data URL to Uint8Array safely
 */
export function base64ToUint8Array(base64Data: string): Uint8Array {
  const parts = base64Data.split(',');
  const rawBase64 = parts.length > 1 ? parts[1] : parts[0];
  const binaryString = atob(rawBase64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Convert base64 data URL to Blob
 */
export function base64ToBlob(base64Data: string, fallbackMime = 'application/octet-stream'): Blob {
  const parts = base64Data.split(',');
  let mime = fallbackMime;
  if (parts.length > 1) {
    const mimeMatch = parts[0].match(/:(.*?);/);
    if (mimeMatch) {
      mime = mimeMatch[1];
    }
  }
  const bytes = base64ToUint8Array(base64Data);
  return new Blob([bytes.buffer as ArrayBuffer], { type: mime });
}

/**
 * Utility to download base64 encoded files directly in browser using Blob URL
 * (Prevents browser security blocks and data-URI limits in Google Chrome / iframes)
 */
export function downloadBase64File(base64Data: string, fileName: string): void {
  try {
    const blob = base64ToBlob(base64Data);
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(blobUrl);
    }, 1000);
  } catch (err) {
    console.error('Failed to download file with blob URL:', err);
    // Direct link fallback
    try {
      const link = document.createElement('a');
      link.href = base64Data;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (fallbackErr) {
      console.error('Fallback download failed:', fallbackErr);
    }
  }
}

/**
 * Optimizes and compresses an uploaded file for safe storage in Firestore (strictly < 1MB limit)
 * - Automatically resizes & compresses images (JPEG ~1200px max, quality ~0.75 -> target 100KB-250KB)
 * - Validates PDF or other documents to ensure they do not exceed 400KB limit
 */
export async function processAndOptimizeUploadFile(
  file: File,
  options: {
    maxDimension?: number;
    targetSizeBytes?: number;
    maxNonImageSizeBytes?: number;
  } = {}
): Promise<{
  base64: string;
  fileName: string;
  sizeBytes: number;
  originalSizeBytes: number;
  wasCompressed: boolean;
}> {
  const maxDimension = options.maxDimension || 1280;
  const targetSizeBytes = options.targetSizeBytes || 250 * 1024; // 250KB base64 max
  const maxNonImageSizeBytes = options.maxNonImageSizeBytes || 400 * 1024; // 400KB for PDFs

  const originalSizeBytes = file.size;
  const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|webp|bmp|gif|heic)$/i.test(file.name);

  if (isImage) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        try {
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            const scale = maxDimension / Math.max(width, height);
            width = Math.round(width * scale);
            height = Math.round(height * scale);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('Không thể khởi tạo môi trường nén ảnh trên trình duyệt.');
          }

          // Fill white background (useful for transparent PNG conversion to JPEG)
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          // Iterative compression to ensure strictly safe size
          let quality = 0.78;
          let base64 = canvas.toDataURL('image/jpeg', quality);

          // If still larger than target, reduce quality
          while (base64.length > targetSizeBytes * 1.33 && quality > 0.4) {
            quality -= 0.12;
            base64 = canvas.toDataURL('image/jpeg', quality);
          }

          // If STILL larger (e.g. very noisy photo), downscale dimensions
          if (base64.length > targetSizeBytes * 1.33 && (width > 800 || height > 800)) {
            canvas.width = Math.round(width * 0.75);
            canvas.height = Math.round(height * 0.75);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            base64 = canvas.toDataURL('image/jpeg', 0.65);
          }

          // Generate clean file name with .jpg extension
          const originalName = file.name;
          const dotIndex = originalName.lastIndexOf('.');
          const baseName = dotIndex > 0 ? originalName.substring(0, dotIndex) : originalName;
          const newFileName = `${baseName}.jpg`;

          resolve({
            base64,
            fileName: newFileName,
            sizeBytes: Math.round((base64.length - 23) * 0.75),
            originalSizeBytes,
            wasCompressed: true,
          });
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Không thể tải hoặc nhận dạng tệp hình ảnh. Vui lòng thử lại với định dạng khác (JPG/PNG).'));
      };

      img.src = objectUrl;
    });
  }

  // Non-image file (e.g., PDF)
  if (file.size > maxNonImageSizeBytes) {
    throw new Error(
      `Tệp "${file.name}" (${formatBytes(file.size)}) vượt quá giới hạn cho phép đối với tài liệu PDF/tệp số (${formatBytes(maxNonImageSizeBytes)}). ` +
      `Vui lòng chụp ảnh tài liệu dạng JPG/PNG (hệ thống sẽ tự động tối ưu hóa nén nhẹ) hoặc nén tệp PDF trước khi tải lên.`
    );
  }

  // Read non-image as data URL
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      resolve({
        base64,
        fileName: file.name,
        sizeBytes: file.size,
        originalSizeBytes,
        wasCompressed: false,
      });
    };
    reader.onerror = () => reject(new Error('Lỗi khi đọc tệp từ thiết bị. Vui lòng thử lại.'));
    reader.readAsDataURL(file);
  });
}

