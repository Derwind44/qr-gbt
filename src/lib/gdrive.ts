/**
 * Utility for Google Drive High-Speed CDN URL Transformation & Optimization.
 *
 * Converts various Google Drive link formats (e.g. view links, share links, or raw File IDs)
 * into Google's high-speed Edge CDN URL format:
 * `https://lh3.googleusercontent.com/d/{FILE_ID}`
 *
 * Benefits:
 * 1. Super-fast direct edge loading (0 Vercel serverless latency or bandwidth usage).
 * 2. 100% CORS compliant for HTML5 Canvas exports and html-to-image downloads.
 * 3. Bypasses rate limits completely.
 */

export function extractGoogleDriveFileId(urlOrId: string): string | null {
  if (!urlOrId || typeof urlOrId !== 'string') return null;
  const clean = urlOrId.trim();
  if (!clean) return null;

  // 1. Format: https://drive.google.com/file/d/FILE_ID/view...
  const matchFileD = clean.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchFileD && matchFileD[1]) {
    return matchFileD[1];
  }

  // 2. Format: https://drive.google.com/open?id=FILE_ID or ?id=FILE_ID
  const matchQueryId = clean.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchQueryId && matchQueryId[1]) {
    return matchQueryId[1];
  }

  // 3. Format: https://lh3.googleusercontent.com/d/FILE_ID
  const matchLh3 = clean.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (matchLh3 && matchLh3[1]) {
    return matchLh3[1];
  }

  // 4. Format: Raw Drive File ID (alphanumeric, dashes, underscores, length >= 15)
  if (/^[a-zA-Z0-9_-]{15,}$/.test(clean)) {
    return clean;
  }

  return null;
}

/**
 * Transforms any Google Drive URL/ID into ultra-fast Edge CDN URL.
 * Returns original URL if it's not a Google Drive link (e.g., Supabase storage, Unsplash, Data URL).
 */
export function formatGoogleDriveUrl(urlOrId?: string | null): string {
  if (!urlOrId) return '';

  const clean = urlOrId.trim();

  // If already a Data URL or external HTTP URL that isn't Google Drive, return as-is
  if (clean.startsWith('data:') || (clean.startsWith('http') && !clean.includes('drive.google.com') && !clean.includes('googleusercontent.com'))) {
    return clean;
  }

  const fileId = extractGoogleDriveFileId(clean);
  if (fileId) {
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  return clean;
}

/**
 * Get configured Google Drive Folder ID from environment variables
 */
export function getGoogleDriveFolderId(): string {
  return process.env.NEXT_PUBLIC_GDRIVE_FOLDER_ID || '';
}
