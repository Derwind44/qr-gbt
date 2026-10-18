const FLASH_KEY = 'flash_message';

/** Stores a one-time message to show as a toast on the next page. */
export function setFlash(message: string) {
  try {
    sessionStorage.setItem(FLASH_KEY, message);
  } catch {
    // ignore
  }
}

export function takeFlash(): string | null {
  try {
    const message = sessionStorage.getItem(FLASH_KEY);
    if (message) sessionStorage.removeItem(FLASH_KEY);
    return message;
  } catch {
    return null;
  }
}
