import { randomBytes } from 'crypto';

export function capitalizedMessage(message: any): string {
  // Ensure that the message is a string
  const strMessage = typeof message === 'string' ? message : String(message);

  return strMessage.charAt(0).toUpperCase() + strMessage.slice(1);
}

export function trimUrl(url: string): string {
  // Regular expression to remove "http://", "https://", and "www."
  return url.replace(/^(https?:\/\/)?(www\.)?/, '');
}

export function formatPhoneNumber(phone: string): string {
  return phone.replace(/^\+/, '');
}

export function generateUniqueString(): string {
  // Generate 4 random bytes
  const randomBuffer = randomBytes(4);

  // Convert the buffer to a base-36 string
  const randomNumber = randomBuffer.readUInt32BE(0); // Read the buffer as a 32-bit unsigned integer
  const base36String = randomNumber.toString(36); // Convert the number to base-36

  // Ensure the string is exactly 8 characters long (pad if needed)
  return base36String.slice(0, 8).padStart(8, '0');
}

export function getFirstItemOrFallback<T>(array: T[]): T {
  // If the array has at least one item, return the first item
  if (array.length > 0) {
    return array[0];
  }

  // If the array is empty, automatically generate a fallback based on the first item's structure
  const fallback = array.length > 0 ? array[0] : {};
  // Return a fallback with null values for all keys (this works for most cases)
  return Object.keys(fallback as object).reduce((acc, key) => {
    acc[key] = null;
    return acc;
  }, {} as T);
}

export function convertAndRound(value: any): number {
  // Convert the value to a number
  const numericValue = parseFloat(value);

  // Check if the value is a valid number (i.e., not NaN)
  if (isNaN(numericValue)) {
    throw new Error('Invalid number');
  }

  // Round to 2 decimal places and add 4
  const roundedValue = Math.round((numericValue + 3) * 100) / 100;

  return roundedValue;
}

// Helper function to convert 'DD-MM-YYYY' to a Date object
export function parseDate(dateString) {
  const [day, month, year] = dateString.split('-');
  return new Date(year, month - 1, day); // JavaScript months are zero-indexed
}

export function isValidFile(file: Express.Multer.File): boolean {
  // Define allowed file types (images and PDF)
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/pdf',
  ];
  const maxSize = 5 * 1024 * 1024; // 5MB limit

  // Check if file type is allowed and size is within the limit
  return allowedTypes.includes(file.mimetype) && file.size <= maxSize;
}

export function validateFiles(files: {
  [key: string]: Express.Multer.File;
}): string | null {
  for (const [fileKey, file] of Object.entries(files)) {
    if (!file) {
      return `${fileKey} is missing`;
    }
    if (!isValidFile(file)) {
      return `${fileKey} is invalid or too large`;
    }
  }
  return null; // All files are valid
}
