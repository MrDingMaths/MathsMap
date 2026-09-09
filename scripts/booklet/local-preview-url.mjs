export function validateCaptureBase(value) {
  const url = new URL(String(value ?? ''));
  if (!['http:', 'https:'].includes(url.protocol) || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
    throw new Error('Fidelity capture is restricted to the local Booklet Studio server');
  }
  return url.origin;
}
