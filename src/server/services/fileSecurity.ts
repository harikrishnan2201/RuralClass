/**
 * File validation and security utilities for imports and exports.
 */

export type AllowedMimeType = 
  | 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // .xlsx
  | 'application/vnd.ms-excel' // .xls
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
  | 'text/csv' // .csv
  | 'application/pdf' // .pdf
  | 'image/jpeg' // .jpg, .jpeg
  | 'image/png' // .png
  | 'image/webp'; // .webp

export interface FileValidationResult {
  valid: boolean;
  detectedType?: AllowedMimeType;
  error?: string;
}

/**
 * Validates file buffer signatures against allowed MIME types.
 */
export function validateFileBuffer(buffer: Buffer, declaredName: string): FileValidationResult {
  if (!buffer || buffer.length === 0) {
    return { valid: false, error: 'Empty file buffer' };
  }

  // Check magic bytes
  // PDF: %PDF (25 50 44 46)
  if (buffer.length >= 4 && buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return { valid: true, detectedType: 'application/pdf' };
  }

  // PNG: 89 50 4E 47
  if (buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return { valid: true, detectedType: 'image/png' };
  }

  // JPEG: FF D8 FF
  if (buffer.length >= 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return { valid: true, detectedType: 'image/jpeg' };
  }

  // WEBP: RIFF .... WEBP
  if (buffer.length >= 12 && 
      buffer.toString('ascii', 0, 4) === 'RIFF' && 
      buffer.toString('ascii', 8, 12) === 'WEBP') {
    return { valid: true, detectedType: 'image/webp' };
  }

  // XLSX or DOCX: PK.. (50 4B 03 04 or 50 4B 05 06 or 50 4B 07 08)
  if (buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4B) {
    if (declaredName.toLowerCase().endsWith('.docx')) {
      return { valid: true, detectedType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
    }
    return { valid: true, detectedType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
  }

  // XLS (Compound File Binary Format): D0 CF 11 E0
  if (buffer.length >= 4 && buffer[0] === 0xD0 && buffer[1] === 0xCF && buffer[2] === 0x11 && buffer[3] === 0xE0) {
    return { valid: true, detectedType: 'application/vnd.ms-excel' };
  }

  // CSV or plain text: verify it doesn't contain null bytes (which indicate binary files)
  const isTextExtension = declaredName.toLowerCase().endsWith('.csv') || declaredName.toLowerCase().endsWith('.txt');
  const sample = buffer.subarray(0, Math.min(buffer.length, 4096));
  const hasNullByte = sample.includes(0x00);

  if (isTextExtension && !hasNullByte) {
    return { valid: true, detectedType: 'text/csv' };
  }

  return { 
    valid: false, 
    error: 'Unsupported file format or invalid file signature' 
  };
}

/**
 * Sanitizes cell values to prevent CSV / Spreadsheet formula injection.
 * Escapes characters =, +, -, @, \t, \r with a leading single quote (')
 * unless the value is a valid numeric string.
 */
export function sanitizeCellValue(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val);

  // If it's a valid finite number like "45", "-5", "+10", do not quote
  if (!isNaN(Number(str)) && str.trim() !== '') {
    return str;
  }

  // If string starts with formula triggering characters, escape with a single quote
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }

  return str;
}
