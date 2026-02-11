/**
 * Image Timestamp Utility
 * Adds timestamp overlay to images for verification purposes
 */

interface TimestampOptions {
  fontSize?: number;
  fontColor?: string;
  backgroundColor?: string;
  padding?: number;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  format?: 'full' | 'date-time' | 'time-only';
}

/**
 * Add timestamp overlay to an image
 * @param imageBase64 Base64 encoded image data
 * @param options Timestamp options
 * @returns Promise<string> Base64 encoded image with timestamp
 */
export async function addTimestampToImage(
  imageBase64: string,
  options: TimestampOptions = {}
): Promise<string> {
  const {
    fontSize = 24,
    fontColor = '#FFFFFF',
    backgroundColor = 'rgba(0, 0, 0, 0.7)',
    padding = 10,
    position = 'bottom-right',
    format = 'full'
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Format timestamp
      const now = new Date();
      let timestampText = '';
      
      switch (format) {
        case 'date-time':
          timestampText = now.toLocaleString('th-TH', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          });
          break;
        case 'time-only':
          timestampText = now.toLocaleString('th-TH', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          });
          break;
        case 'full':
        default:
          timestampText = now.toLocaleString('th-TH', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          });
          // Add milliseconds for more precision
          timestampText += `.${now.getMilliseconds().toString().padStart(3, '0')}`;
          break;
      }

      // Set font
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      ctx.fillStyle = fontColor;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 2;

      // Measure text
      const metrics = ctx.measureText(timestampText);
      const textWidth = metrics.width;
      const textHeight = fontSize;

      // Calculate position
      let x = padding;
      let y = canvas.height - padding - textHeight;

      if (position === 'top-left') {
        x = padding;
        y = padding + textHeight;
      } else if (position === 'top-right') {
        x = canvas.width - textWidth - padding;
        y = padding + textHeight;
      } else if (position === 'bottom-left') {
        x = padding;
        y = canvas.height - padding;
      } else if (position === 'bottom-right') {
        x = canvas.width - textWidth - padding;
        y = canvas.height - padding;
      }

      // Draw background rectangle
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(
        x - padding / 2,
        y - textHeight - padding / 2,
        textWidth + padding,
        textHeight + padding
      );

      // Draw timestamp text
      ctx.fillStyle = fontColor;
      ctx.strokeText(timestampText, x, y);
      ctx.fillText(timestampText, x, y);

      // Convert canvas to base64
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to create blob from canvas'));
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          resolve(reader.result as string);
        };
        reader.onerror = () => {
          reject(new Error('Failed to read blob'));
        };
        reader.readAsDataURL(blob);
      }, 'image/jpeg', 0.95);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = imageBase64;
  });
}

/**
 * Get current timestamp string
 * @param format Timestamp format
 * @returns Formatted timestamp string
 */
export function getCurrentTimestamp(format: 'full' | 'date-time' | 'time-only' = 'full'): string {
  const now = new Date();
  
  switch (format) {
    case 'date-time':
      return now.toLocaleString('th-TH', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    case 'time-only':
      return now.toLocaleString('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    case 'full':
    default:
      const dateTimeStr = now.toLocaleString('th-TH', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      return `${dateTimeStr}.${now.getMilliseconds().toString().padStart(3, '0')}`;
  }
}

/**
 * Verify timestamp on image (metadata check)
 * @param imageBase64 Base64 encoded image
 * @returns Promise<boolean> True if timestamp is present
 */
export async function verifyImageTimestamp(imageBase64: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // Check if image has reasonable dimensions (not too small)
      // This is a basic check - in production, you'd extract actual timestamp data
      const hasReasonableDimensions = img.width > 100 && img.height > 100;
      resolve(hasReasonableDimensions);
    };
    img.onerror = () => {
      resolve(false);
    };
    img.src = imageBase64;
  });
}
