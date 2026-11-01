import { toast } from 'sonner';

export const STATIC_APK_URL =
  'https://github.com/suhebdev/apps/releases/download/staffbook-v1.0.0/StaffBook.apk';

export const DEFAULT_APK_URL = STATIC_APK_URL;

export function getApkUrl(): string {
  return STATIC_APK_URL;
}

/**
 * Triggers APK file download without navigating the user away from the app.
 * Utilizes a hidden iframe to initiate browser download while preserving
 * the current route, state, and window focus.
 */
export function downloadApk(customUrl?: string): void {
  const url = customUrl || getApkUrl();

  try {
    toast.info('Starting StaffBook APK download...', {
      description: 'Your download should begin shortly.',
      duration: 3500,
    });

    // Hidden iframe trick triggers attachment download without leaving the web page
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    iframe.style.width = '1px';
    iframe.style.height = '1px';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    iframe.setAttribute('aria-hidden', 'true');
    iframe.src = url;

    document.body.appendChild(iframe);

    // Clean up iframe after download has been handed to browser download manager
    setTimeout(() => {
      try {
        if (iframe.parentNode) {
          document.body.removeChild(iframe);
        }
      } catch (_) {}
    }, 20000);
  } catch (err) {
    console.warn('[APK Download] Iframe trigger fallback to anchor:', err);
    // Fallback: Invisible anchor click
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'StaffBook.apk';
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }
}
